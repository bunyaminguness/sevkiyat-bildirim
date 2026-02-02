namespace SevkiyatBildirimApi.DTOs;

public record RegisterRequest(string Email, string Password, string DisplayName, string? StoreCode);

public record GoogleAuthRequest(string Code);

public record MicrosoftAuthRequest(string AccessToken);

public record MagicLinkRequest(string Email);

public record MagicLinkValidateRequest(string Token);

public record MagicLinkResponse(string Message, int ExpiresIn);
