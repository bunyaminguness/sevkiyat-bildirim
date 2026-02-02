namespace SevkiyatBildirimApi.Models;

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public string? PasswordHash { get; set; } // Nullable - OAuth users don't have password
    public required string Role { get; set; } // "Manager" or "Assistant"
    public required string DisplayName { get; set; }
    public string? StoreCode { get; set; }
    
    // Multi-auth fields
    public AuthProvider Provider { get; set; } = AuthProvider.Local;
    public string? ProviderId { get; set; } // OAuth provider's unique user ID
    public string? ProfileImageUrl { get; set; } // OAuth profile picture
    
    // Gmail Integration
    public string? GoogleRefreshToken { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; } // Track last login time
}

