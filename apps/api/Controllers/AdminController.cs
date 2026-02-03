using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Middleware;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[AdminOnly]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<AdminController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Get all allowed users
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllowedUsers()
    {
        var users = await _context.AllowedUsers
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AllowedUserDto
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role.ToString(),
                StoreCode = u.StoreCode,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Add new allowed user
    /// </summary>
    [HttpPost("users")]
    public async Task<IActionResult> CreateAllowedUser([FromBody] CreateAllowedUserRequest request)
    {
        // Validate email
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            return BadRequest(new { message = "Geçerli bir email adresi giriniz." });
        }

        var normalizedEmail = request.Email.ToLowerInvariant();

        // Check if already exists
        var exists = await _context.AllowedUsers.AnyAsync(u => u.Email == normalizedEmail);
        if (exists)
        {
            return BadRequest(new { message = "Bu email adresi zaten kayıtlı." });
        }

        // Validate role
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
        {
            return BadRequest(new { message = "Geçersiz rol." });
        }

        var newUser = new AllowedUser
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            Role = (UserRole)request.Role,
            StoreCode = request.StoreCode,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.AllowedUsers.Add(newUser);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin created new allowed user: {Email}", normalizedEmail);

        return Ok(new AllowedUserDto
        {
            Id = newUser.Id,
            Email = newUser.Email,
            Role = newUser.Role.ToString(),
            StoreCode = newUser.StoreCode,
            IsActive = newUser.IsActive,
            CreatedAt = newUser.CreatedAt
        });
    }

    /// <summary>
    /// Update allowed user
    /// </summary>
    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateAllowedUser(Guid id, [FromBody] UpdateAllowedUserRequest request)
    {
        var user = await _context.AllowedUsers.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        // Update fields
        if (request.Role.HasValue)
        {
            if (!Enum.IsDefined(typeof(UserRole), request.Role.Value))
            {
                return BadRequest(new { message = "Geçersiz rol." });
            }
            user.Role = (UserRole)request.Role.Value;
        }

        if (request.StoreCode != null)
        {
            user.StoreCode = request.StoreCode;
        }

        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin updated allowed user: {Email}", user.Email);

        return Ok(new AllowedUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role.ToString(),
            StoreCode = user.StoreCode,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Delete allowed user
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteAllowedUser(Guid id)
    {
        var user = await _context.AllowedUsers.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message_tr = "Kullanıcı bulunamadı" });
        }

        _context.AllowedUsers.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message_tr = "Kullanıcı başarıyla silindi" });
    }

    /// <summary>
    /// Set user password
    /// </summary>
    [HttpPost("users/set-password")]
    public async Task<IActionResult> SetUserPassword([FromBody] SetPasswordRequest request)
    {
        // Check if allowed user exists
        var normalizedEmail = request.Email.ToLowerInvariant();
        var allowedUser = await _context.AllowedUsers
            .FirstOrDefaultAsync(au => au.Email == normalizedEmail);

        if (allowedUser == null)
        {
            return NotFound(new { message = "Bu email adresi izin verilen kullanıcılar listesinde yok" });
        }

        // Check if actual user exists
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            // Create user if not exists
            user = new User
            {
                Email = normalizedEmail,
                Role = allowedUser.Role.ToString(),
                StoreCode = allowedUser.StoreCode,
                DisplayName = normalizedEmail.Split('@')[0], // Default display name
                Provider = AuthProvider.Local,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }

        // Set password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Password set for user: {Email}", normalizedEmail);

        return Ok(new { message = "Şifre başarıyla güncellendi" });
    }

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _context.AllowedUsers.CountAsync();
        var totalReports = await _context.Reports.CountAsync();

        var reportsByStatus = await _context.Reports
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        // Recent activity (last 10 reports)
        var recentReports = await _context.Reports
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new RecentActivityDto
            {
                Type = "report_created",
                Description = $"Rapor #{r.ReportNo} oluşturuldu - {r.Type}",
                Timestamp = r.CreatedAt
            })
            .ToListAsync();

        return Ok(new AdminStatsResponse
        {
            TotalUsers = totalUsers,
            TotalReports = totalReports,
            ReportsByStatus = reportsByStatus,
            RecentActivity = recentReports
        });
    }

    /// <summary>
    /// Get current business hours configuration
    /// </summary>
    [HttpGet("business-hours")]
    public IActionResult GetBusinessHours()
    {
        var config = _configuration.GetSection("BusinessHours");

        return Ok(new BusinessHoursConfigDto
        {
            Enabled = config.GetValue<bool>("Enabled"),
            TimeZone = config.GetValue<string>("TimeZone") ?? "Europe/Istanbul",
            Start = config.GetValue<string>("Start") ?? "09:00",
            End = config.GetValue<string>("End") ?? "18:00",
            Days = config.GetSection("Days").Get<List<string>>() ?? new()
        });
    }

    /// <summary>
    /// Update business hours configuration
    /// NOTE: This updates appsettings.json - requires app restart to take effect
    /// </summary>
    [HttpPut("business-hours")]
    public IActionResult UpdateBusinessHours([FromBody] BusinessHoursConfigDto request)
    {
        // Note: Updating appsettings.json at runtime is complex and not recommended
        // For production, consider storing in database instead
        return Ok(new 
        { 
            message = "Business hours güncellemesi için appsettings.json dosyasını manuel olarak düzenleyin ve server'ı yeniden başlatın.",
            currentConfig = GetBusinessHours()
        });
    }

    /// <summary>
    /// Get all reports with filtering (admin only)
    /// </summary>
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(
        [FromQuery] string? status,
        [FromQuery] string? storeCode,
        [FromQuery] string? q)
    {
        var query = _context.Reports.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(storeCode))
        {
            query = query.Where(r => r.StoreCode.Contains(storeCode));
        }

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(r => 
                r.ReportNo.Contains(q) || 
                r.TplNo.Contains(q) ||
                r.Notes!.Contains(q));
        }

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Take(100)
            .Select(r => new
            {
                r.Id,
                r.ReportNo,
                r.StoreCode,
                r.Type,
                Status = r.Status.ToString(),
                r.TplNo,
                r.WaybillNo,
                r.CreatedAt,
                CreatedBy = r.CreatedBy.DisplayName,
                ItemCount = r.Items.Count
            })
            .ToListAsync();

        return Ok(reports);
    }

    /// <summary>
    /// Update report status (admin only)
    /// </summary>
    [HttpPatch("reports/{id}/status")]
    public async Task<IActionResult> UpdateReportStatus(int id, [FromBody] UpdateReportStatusRequest request)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
        {
            return NotFound(new { message = "Rapor bulunamadı." });
        }

        // Validate status value
        var validStatuses = new[] { "Draft", "Sent", "Accepted", "Rejected", "Closed" };
        if (!validStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Geçersiz durum." });
        }

        report.Status = request.Status;
        report.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin updated report {ReportNo} status to {Status}", report.ReportNo, request.Status);

        return Ok(new { message = "Rapor durumu güncellendi.", status = request.Status });
    }
}
