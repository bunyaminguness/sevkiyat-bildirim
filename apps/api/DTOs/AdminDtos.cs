namespace SevkiyatBildirimApi.DTOs;

public class AllowedUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? StoreCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAllowedUserRequest
{
    public string Email { get; set; } = string.Empty;
    public int Role { get; set; } // 0=Admin, 1=Manager, 2=Assistant
    public string? StoreCode { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateAllowedUserRequest
{
    public int? Role { get; set; }
    public string? StoreCode { get; set; }
    public bool? IsActive { get; set; }
}

public class BusinessHoursConfigDto
{
    public bool Enabled { get; set; }
    public string TimeZone { get; set; } = string.Empty;
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
    public List<string> Days { get; set; } = new();
}

public class AdminStatsResponse
{
    public int TotalUsers { get; set; }
    public int TotalReports { get; set; }
    public Dictionary<string, int> ReportsByStatus { get; set; } = new();
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty; // "report_created", "report_sent", etc.
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
