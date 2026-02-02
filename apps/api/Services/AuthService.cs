using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.Models;
using SevkiyatBildirimApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SevkiyatBildirimApi.Services;

public interface IAuthService
{
    Task<(User? User, string? Token)> LoginAsync(string email, string password);
    Task<LoginResponse> RegisterAsync(string email, string password, string displayName, string? storeCode);
    string GenerateJwtToken(User user);
    bool VerifyPassword(string password, string hash);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<(User? User, string? Token)> LoginAsync(string email, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        
        // Check if user exists and has a password (not OAuth user)
        if (user == null || user.PasswordHash == null || !VerifyPassword(password, user.PasswordHash))
        {
            return (null, null);
        }

        // Update last login time
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return (user, token);
    }

    public string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured"))
        );
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("StoreCode", user.StoreCode ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    public async Task<LoginResponse> RegisterAsync(string email, string password, string displayName, string? storeCode)
    {
        // Check if user already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Bu email adresi zaten kayıtlı");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        // Create new user
        var user = new User
        {
            Email = email,
            PasswordHash = passwordHash,
            DisplayName = displayName,
            Role = "Manager", // Default role
            StoreCode = storeCode,
            Provider = AuthProvider.Local,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };


        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate token
        var token = GenerateJwtToken(user);

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.Role,
            user.DisplayName,
            user.StoreCode,
            user.ProfileImageUrl
        );

        return new LoginResponse(userDto, token);
    }
}
