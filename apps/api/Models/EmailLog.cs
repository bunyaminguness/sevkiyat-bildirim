namespace SevkiyatBildirimApi.Models;

public class EmailLog
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public required string To { get; set; }
    public required string Subject { get; set; }
    public required string Body { get; set; }
    public DateTime? SentAt { get; set; }
    public string? ProviderMessageId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
