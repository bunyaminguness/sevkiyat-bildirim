namespace SevkiyatBildirimApi.Models;

public enum UserRole
{
    Admin,
    Manager,
    Assistant
}

public class AllowedUser
{
    public Guid Id { get; set; }
    public required string Email { get; set; } // normalized lowercase
    public UserRole Role { get; set; }
    public string? StoreCode { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
