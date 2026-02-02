using Microsoft.EntityFrameworkCore;
using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Services;

public class MagicLinkService : IMagicLinkService
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MagicLinkService> _logger;
    private const int EXPIRATION_MINUTES = 15;

    public MagicLinkService(
        AppDbContext context,
        IAuthService authService,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<MagicLinkService> logger)
    {
        _context = context;
        _authService = authService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<MagicLinkResponse> GenerateMagicLink(string email)
    {
        // Validate email exists in system
        var userExists = await _context.Users.AnyAsync(u => u.Email == email);
        
        if (!userExists)
        {
            _logger.LogWarning("Magic link requested for non-existent user: {Email}", email);
            // Don't reveal if user exists or not for security
            return new MagicLinkResponse("If this email exists, you will receive a magic link shortly.", EXPIRATION_MINUTES * 60);
        }

        // Rate limiting: Check for recent tokens
        var recentToken = await _context.MagicLinkTokens
            .Where(t => t.Email == email && t.CreatedAt > DateTime.UtcNow.AddMinutes(-1))
            .FirstOrDefaultAsync();

        if (recentToken != null)
        {
            _logger.LogWarning("Rate limit: Magic link already sent to {Email} in last minute", email);
            throw new InvalidOperationException("Please wait 1 minute before requesting another magic link.");
        }

        // Generate unique token
        var token = Guid.NewGuid().ToString();
        var expiresAt = DateTime.UtcNow.AddMinutes(EXPIRATION_MINUTES);

        // Save token to database
        var magicLinkToken = new MagicLinkToken
        {
            Email = email,
            Token = token,
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.MagicLinkTokens.Add(magicLinkToken);
        await _context.SaveChangesAsync();

        // Generate magic link URL
        var baseUrl = _configuration["MagicLink:BaseUrl"] ?? "http://localhost:3000";
        var magicLinkUrl = $"{baseUrl}/auth/magic-link?token={token}";

        // Send email
        var emailSubject = "Giriş Linkiniz - Sevkiyat Bildirim";
        var emailBody = $@"
<html>
<body>
    <h2>Merhaba,</h2>
    <p>Sevkiyat Bildirim sistemine giriş yapmak için aşağıdaki linke tıklayın:</p>
    <p>
        <a href=""{magicLinkUrl}"" style=""background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;"">
            Giriş Yap
        </a>
    </p>
    <p>Veya bu linki tarayıcınıza kopyalayın:<br>
    <code>{magicLinkUrl}</code></p>
    <p><strong>Bu link {EXPIRATION_MINUTES} dakika geçerlidir ve tek kullanımlıktır.</strong></p>
    <p>Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
    <hr>
    <p style=""color: #666; font-size: 12px;"">Sevkiyat Bildirim Sistemi</p>
</body>
</html>";

        try
        {
            await _emailService.SendEmailAsync(email, emailSubject, emailBody);
            _logger.LogInformation("Magic link sent to {Email}, expires at {ExpiresAt}", email, expiresAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send magic link email to {Email}", email);
            // Remove the token since email failed
            _context.MagicLinkTokens.Remove(magicLinkToken);
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Failed to send magic link email. Please try again later.");
        }

        return new MagicLinkResponse("Magic link sent to your email. Please check your inbox.", EXPIRATION_MINUTES * 60);
    }

    public async Task<LoginResponse> ValidateMagicLink(string token)
    {
        // Find token
        var magicLinkToken = await _context.MagicLinkTokens
            .FirstOrDefaultAsync(t => t.Token == token);

        if (magicLinkToken == null)
        {
            _logger.LogWarning("Invalid magic link token attempted: {Token}", token);
            throw new UnauthorizedAccessException("Invalid or expired magic link.");
        }

        // Check if already used
        if (magicLinkToken.IsUsed)
        {
            _logger.LogWarning("Magic link token already used: {Token}", token);
            throw new UnauthorizedAccessException("This magic link has already been used.");
        }

        // Check if expired
        if (magicLinkToken.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Expired magic link token: {Token}", token);
            throw new UnauthorizedAccessException("This magic link has expired. Please request a new one.");
        }

        // Mark as used
        magicLinkToken.IsUsed = true;
        await _context.SaveChangesAsync();

        // Get user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == magicLinkToken.Email);
        
        if (user == null)
        {
            _logger.LogError("User not found for magic link: {Email}", magicLinkToken.Email);
            throw new UnauthorizedAccessException("User not found.");
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Generate JWT token
        var jwtToken = _authService.GenerateJwtToken(user);

        _logger.LogInformation("Magic link validated successfully for {Email}", user.Email);

        return new LoginResponse(
            new UserDto(
                user.Id,
                user.Email,
                user.Role,
                user.DisplayName,
                user.StoreCode,
                user.ProfileImageUrl
            ),
            jwtToken
        );
    }

    public async Task CleanupExpiredTokens()
    {
        var expiredTokens = await _context.MagicLinkTokens
            .Where(t => t.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        if (expiredTokens.Any())
        {
            _context.MagicLinkTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} expired magic link tokens", expiredTokens.Count);
        }
    }
}
