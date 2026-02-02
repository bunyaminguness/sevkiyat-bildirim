namespace SevkiyatBildirimApi.Models;

public class ReportAction
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public Report? Report { get; set; }
    public required string ActionType { get; set; } // "CREATED", "UPDATED", "SENT", "RESENT", "ACCEPTED", "REJECTED", "NOTE_ADDED", "CLOSED"
    public int ActorId { get; set; }
    public required string ActorName { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
