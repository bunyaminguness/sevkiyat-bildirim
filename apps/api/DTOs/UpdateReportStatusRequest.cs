namespace SevkiyatBildirimApi.DTOs;

public class UpdateReportStatusRequest
{
    public string Status { get; set; } = string.Empty; // "Draft", "Sent", "Accepted", "Rejected", "Closed"
}
