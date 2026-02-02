using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.DTOs;

public record EmailPreviewRequest(
    string? ReportNo,
    string StoreCode,
    string TplNo,
    string? WaybillNo,
    DateTime ShipmentDate,
    string Type,
    List<ReportItemDto> Items,
    string? Notes,
    string? RecipientEmail
);

public record EmailPreviewResponse(
    string Subject,
    string Body,
    string Recipient
);

public record RecipientOption(string Label, string Email);
