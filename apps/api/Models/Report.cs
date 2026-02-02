namespace SevkiyatBildirimApi.Models;

public class Report
{
    public int Id { get; set; }
    public required string ReportNo { get; set; } // SK-2026-000231
    public required string StoreCode { get; set; }
    public required string Type { get; set; } // "Missing" or "Damaged"
    public required string Status { get; set; } // "Draft", "Sent", "Accepted", "Rejected", "Closed"
    public required string TplNo { get; set; }
    public string? WaybillNo { get; set; }
    public DateTime ShipmentDate { get; set; }
    public string? Notes { get; set; }
    
    public string? RecipientEmail { get; set; }

    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int ResendCount { get; set; } = 0;
    public string? Recipients { get; set; } // Semicolon separated emails
    
    // Navigation properties
    public List<ReportItem> Items { get; set; } = new();
    public List<ReportAction> Actions { get; set; } = new();
    public List<EmailLog> EmailLogs { get; set; } = new();
}
