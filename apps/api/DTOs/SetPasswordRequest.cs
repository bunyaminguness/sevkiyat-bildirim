namespace SevkiyatBildirimApi.DTOs;

public record SetPasswordRequest(
    string Email,
    string Password
);
