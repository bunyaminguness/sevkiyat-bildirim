using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Services;

public interface IOAuthService
{
    Task<LoginResponse> HandleGoogleCallback(string code);
    Task<LoginResponse> HandleGoogleCallbackServerSide(string code, string redirectUri);
    Task<LoginResponse> HandleMicrosoftCallback(string accessToken);
}
