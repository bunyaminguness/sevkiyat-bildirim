namespace SevkiyatBildirimApi.Models;

public enum AuthProvider
{
    Local = 0,      // Email/Şifre
    Google = 1,     // Google OAuth
    Microsoft = 2,  // Microsoft OAuth  
    MagicLink = 3   // Magic Link (şifresiz)
}
