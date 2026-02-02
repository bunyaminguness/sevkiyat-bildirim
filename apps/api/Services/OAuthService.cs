using Google.Apis.Auth;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Services;

public class OAuthService : IOAuthService
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OAuthService> _logger;

    public OAuthService(
        AppDbContext context,
        IAuthService authService,
        IConfiguration configuration,
        ILogger<OAuthService> logger)
    {
        _context = context;
        _authService = authService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse> HandleGoogleCallback(string code)
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Google ClientId or ClientSecret is missing");
            }

            // Create the flow
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                },
                Scopes = new[] { "openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send" }
            });

            // Exchange code for token
            // Redirect URI must match the one used in frontend. For 'postmessage' flow, use "postmessage".
            var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                userId: "user", // Temporary user ID for the flow
                code: code,
                redirectUri: "postmessage", 
                CancellationToken.None
            );

            // Verify Google ID token from response
            var payload = await GoogleJsonWebSignature.ValidateAsync(tokenResponse.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            });
            
            if (payload == null || string.IsNullOrEmpty(payload.Email))
            {
                throw new UnauthorizedAccessException("Invalid Google token");
            }

            _logger.LogInformation("Google OAuth: Validated token for {Email}", payload.Email);

            // Get or create user
            var user = await GetOrCreateOAuthUser(
                payload.Email,
                payload.Name ?? payload.Email,
                payload.Subject, // Google's unique user ID
                AuthProvider.Google,
                payload.Picture,
                tokenResponse.RefreshToken
            );

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);
            var isAdmin = user.Role == "Admin" || user.Role == "0";

            return new LoginResponse(
                new UserDto(
                    user.Id,
                    user.Email,
                    user.Role,
                    user.DisplayName,
                    user.StoreCode,
                    user.ProfileImageUrl,
                    isAdmin
                ),
                token
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Google OAuth callback");
            throw;
        }
    }

    public async Task<LoginResponse> HandleGoogleCallbackServerSide(string code, string redirectUri)
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new InvalidOperationException("Google ClientId or ClientSecret is missing");
            }

            // Create the flow for server-side OAuth
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret
                },
                Scopes = new[] { "openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send" }
            });

            // Exchange code for token using the correct redirect URI
            var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                userId: "user", // Temporary user ID for the flow
                code: code,
                redirectUri: redirectUri,
                CancellationToken.None
            );

            // Verify Google ID token from response
            var payload = await GoogleJsonWebSignature.ValidateAsync(tokenResponse.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            });
            
            if (payload == null || string.IsNullOrEmpty(payload.Email))
            {
                throw new UnauthorizedAccessException("Invalid Google token");
            }

            _logger.LogInformation("Google OAuth (server-side): Validated token for {Email}", payload.Email);

            // Get or create user
            var user = await GetOrCreateOAuthUser(
                payload.Email,
                payload.Name ?? payload.Email,
                payload.Subject, // Google's unique user ID
                AuthProvider.Google,
                payload.Picture,
                tokenResponse.RefreshToken
            );

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);
            var isAdminExisting = user.Role == "Admin" || user.Role == "0";

            return new LoginResponse(
                new UserDto(
                    user.Id,
                    user.Email,
                    user.Role,
                    user.DisplayName,
                    user.StoreCode,
                    user.ProfileImageUrl,
                    isAdminExisting
                ),
                token
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Google OAuth callback (server-side)");
            throw;
        }
    }

    public async Task<LoginResponse> HandleMicrosoftCallback(string accessToken)
    {
        try
        {
            // Use Microsoft Graph API to get user info
            var userInfo = await GetMicrosoftUserInfo(accessToken);

            if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
            {
                throw new UnauthorizedAccessException("Invalid Microsoft token");
            }

            _logger.LogInformation("Microsoft OAuth: Validated token for {Email}", userInfo.Email);

            // Get or create user
            var user = await GetOrCreateOAuthUser(
                userInfo.Email,
                userInfo.DisplayName ?? userInfo.Email,
                userInfo.Id, // Microsoft's unique user ID
                AuthProvider.Microsoft,
                userInfo.ProfileImageUrl
            );

            // Generate JWT token
            var token = _authService.GenerateJwtToken(user);
            var isAdminMicrosoft = user.Role == "Admin" || user.Role == "0";

            return new LoginResponse(
                new UserDto(
                    user.Id,
                    user.Email,
                    user.Role,
                    user.DisplayName,
                    user.StoreCode,
                    user.ProfileImageUrl,
                    isAdminMicrosoft
                ),
                token
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Microsoft OAuth callback");
            throw;
        }
    }

    private async Task<User> GetOrCreateOAuthUser(
        string email,
        string displayName,
        string providerId,
        AuthProvider provider,
        string? profileImageUrl,
        string? refreshToken = null)
    {
        // Check if user is in allowlist FIRST
        var normalizedEmail = email.ToLowerInvariant();
        var allowedUser = await _context.AllowedUsers
            .FirstOrDefaultAsync(au => au.Email == normalizedEmail);

        if (allowedUser == null || !allowedUser.IsActive)
        {
            _logger.LogWarning("OAuth login attempt for non-allowed email: {Email}", email);
            throw new UnauthorizedAccessException("Bu hesaba erişim izni yok. Müdürünüzle iletişime geçin.");
        }

        // Try to find user by email first
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user != null)
        {
            // Update OAuth fields if user exists
            user.Provider = provider;
            user.ProviderId = providerId;
            user.ProfileImageUrl = profileImageUrl;
            user.LastLoginAt = DateTime.UtcNow;
            
            // Only update refresh token if a new one is provided. 
            // Google doesn't always return a refresh token (only on first consent).
            if (!string.IsNullOrEmpty(refreshToken))
            {
                user.GoogleRefreshToken = refreshToken;
            }
            
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated existing user {Email} with {Provider} OAuth data", email, provider);
            
            return user;
        }

        // Create new user
        user = new User
        {
            Email = email,
            DisplayName = displayName,
            Role = "Manager", // Default role for OAuth users
            Provider = provider,
            ProviderId = providerId,
            ProfileImageUrl = profileImageUrl,
            PasswordHash = null, // OAuth users don't have password
            GoogleRefreshToken = refreshToken,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Created new OAuth user {Email} with provider {Provider}", email, provider);

        return user;
    }

    private async Task<MicrosoftUserInfo?> GetMicrosoftUserInfo(string accessToken)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var response = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");
        
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Failed to get Microsoft user info: {StatusCode}", response.StatusCode);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync();
        var userInfo = System.Text.Json.JsonSerializer.Deserialize<MicrosoftUserInfo>(json);
        
        return userInfo;
    }

    private class MicrosoftUserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Mail { get; set; }
        public string? UserPrincipalName { get; set; }
        
        public string Email => Mail ?? UserPrincipalName ?? string.Empty;
        public string? ProfileImageUrl => null; // Microsoft Graph photos require separate API call
    }
}
