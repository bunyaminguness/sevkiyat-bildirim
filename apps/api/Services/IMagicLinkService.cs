using SevkiyatBildirimApi.DTOs;

namespace SevkiyatBildirimApi.Services;

public interface IMagicLinkService
{
    Task<MagicLinkResponse> GenerateMagicLink(string email);
    Task<LoginResponse> ValidateMagicLink(string token);
    Task CleanupExpiredTokens();
}
