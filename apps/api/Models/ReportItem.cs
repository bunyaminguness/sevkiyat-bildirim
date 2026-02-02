namespace SevkiyatBildirimApi.Models;

public class ReportItem
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public required string ProductNo { get; set; }
    public required string ProductName { get; set; }
    public int Qty { get; set; }
    public string? DamageType { get; set; } // Only for Damaged reports
    public string? PhotoUrl { get; set; } // Structure for future implementation
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
