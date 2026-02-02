using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Services;
using System.Security.Claims;

namespace SevkiyatBildirimApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IOAuthService _oauthService;
    private readonly IMagicLinkService _magicLinkService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        IOAuthService oauthService,
        IMagicLinkService magicLinkService,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        IWebHostEnvironment env)
    {
        _authService = authService;
        _oauthService = oauthService;
        _magicLinkService = magicLinkService;
        _configuration = configuration;
        _logger = logger;
        _env = env;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (user, token) = await _authService.LoginAsync(request.Email, request.Password);
            
            if (user == null || token == null)
            {
                return Unauthorized(new { message_tr = "Email veya şifre hatalı" });
            }

            // Set httpOnly cookie
            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // false in dev (HTTP), true in prod (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            var isAdmin = user.Role == "Admin" || user.Role == "0";
            var userDto = new UserDto(
                user.Id,
                user.Email,
                user.Role,
                user.DisplayName,
                user.StoreCode,
                user.ProfileImageUrl,
                isAdmin
            );

            return Ok(new LoginResponse(userDto, token));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { code = "not_allowed", message_tr = ex.Message });
        }
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
            {
                _logger.LogError("Google ClientId is not configured");
                return BadRequest(new { message = "Google authentication is not configured", message_tr = "Google kimlik doğrulama yapılandırılmamış" });
            }

            // Generate state for CSRF protection
            var state = Guid.NewGuid().ToString();
            Response.Cookies.Append("oauth_state", state, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // false in dev (HTTP), true in prod (HTTPS)
                SameSite = SameSiteMode.Lax, // Lax needed for OAuth redirect
                Expires = DateTimeOffset.UtcNow.AddMinutes(10)
            });

            var redirectUri = $"{Request.Scheme}://{Request.Host}/api/auth/google/callback";
            var scope = Uri.EscapeDataString("openid email profile https://www.googleapis.com/auth/gmail.send");
            
            var googleAuthUrl = $"https://accounts.google.com/o/oauth2/v2/auth" +
                $"?client_id={clientId}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&response_type=code" +
                $"&scope={scope}" +
                $"&access_type=offline" +
                $"&prompt=consent" +
                $"&state={state}";

            _logger.LogInformation("Redirecting to Google OAuth with redirect_uri: {RedirectUri}", redirectUri);
            return Redirect(googleAuthUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Google OAuth");
            return StatusCode(500, new { message = "Internal server error", message_tr = "Sunucu hatası" });
        }
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string state, [FromQuery] string? error)
    {
        try
        {
            // Check for OAuth errors
            if (!string.IsNullOrEmpty(error))
            {
                _logger.LogWarning("Google OAuth error: {Error}", error);
                var frontendUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
                return Redirect($"{frontendUrl}/login?error=google_oauth_failed");
            }

            // Validate state (CSRF protection)
            var storedState = Request.Cookies["oauth_state"];
            if (string.IsNullOrEmpty(storedState) || storedState != state)
            {
                _logger.LogWarning("OAuth state mismatch. Stored: {Stored}, Received: {Received}", storedState, state);
                var frontendUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
                return Redirect($"{frontendUrl}/login?error=invalid_state");
            }

            // Clear state cookie
            Response.Cookies.Delete("oauth_state");

            if (string.IsNullOrEmpty(code))
            {
                _logger.LogWarning("No authorization code received from Google");
                var frontendUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
                return Redirect($"{frontendUrl}/login?error=no_code");
            }

            var redirectUri = $"{Request.Scheme}://{Request.Host}/api/auth/google/callback";
            var response = await _oauthService.HandleGoogleCallbackServerSide(code, redirectUri);
            
            // Set httpOnly cookie
            Response.Cookies.Append("auth_token", response.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // false in dev (HTTP), true in prod (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            // Redirect to frontend
            var successUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
            _logger.LogInformation("Google OAuth successful for user {Email}, redirecting to {Url}", response.User.Email, successUrl);
            return Redirect($"{successUrl}/reports");
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Google OAuth callback failed: Unauthorized");
            var frontendUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendUrl}/login?error=unauthorized");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in Google OAuth callback");
            var frontendUrl = _configuration["Auth:FrontendBaseUrl"] ?? "http://localhost:3000";
            return Redirect($"{frontendUrl}/login?error=server_error");
        }
    }

    [HttpPost("microsoft")]
    public async Task<IActionResult> MicrosoftLogin([FromBody] MicrosoftAuthRequest request)
    {
        try
        {
            var response = await _oauthService.HandleMicrosoftCallback(request.AccessToken);
            
            // Set httpOnly cookie
            Response.Cookies.Append("auth_token", response.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // false in dev (HTTP), true in prod (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Microsoft OAuth failed");
            return Unauthorized(new { message_tr = "Microsoft girişi başarısız" });
        }
    }

    [HttpPost("magic-link/request")]
    public async Task<IActionResult> RequestMagicLink([FromBody] MagicLinkRequest request)
    {
        try
        {
            var response = await _magicLinkService.GenerateMagicLink(request.Email);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Magic link request failed for {Email}", request.Email);
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("magic-link/validate")]
    public async Task<IActionResult> ValidateMagicLink([FromBody] MagicLinkValidateRequest request)
    {
        try
        {
            var response = await _magicLinkService.ValidateMagicLink(request.Token);
            
            // Set httpOnly cookie
            Response.Cookies.Append("auth_token", response.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(), // false in dev (HTTP), true in prod (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Magic link validation failed");
            return Unauthorized(new { message_tr = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token");
        return Ok(new { message_tr = "Çıkış yapıldı" });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var email = User.FindFirstValue(ClaimTypes.Email)!;
        var displayName = User.FindFirstValue(ClaimTypes.Name)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        var storeCode = User.FindFirstValue("StoreCode");

        var isAdmin = role == "Admin" || role == "0";
        var userDto = new UserDto(userId, email, role, displayName, storeCode, null, isAdmin);
        return Ok(userDto);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request.Email, request.Password, request.DisplayName, request.StoreCode);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }
}
