namespace SevkiyatBildirimApi.DTOs;

// Auth DTOs
public record LoginRequest(string Email, string Password);

public record LoginResponse(
    UserDto User,
    string Token
);

public record UserDto(
    int Id,
    string Email,
    string Role,
    string DisplayName,
    string? StoreCode,
    string? ProfileImageUrl = null
);

// Report DTOs
public record CreateReportRequest(
    string StoreCode,
    string Type, // "Missing" or "Damaged"
    string TplNo,
    string? WaybillNo,
    DateTime ShipmentDate,
    string? Notes,
    List<ReportItemRequest> Items,
    List<string>? Recipients = null
);

public record UpdateReportRequest(
    string StoreCode,
    string Type,
    string TplNo,
    string? WaybillNo,
    DateTime ShipmentDate,
    string? Notes,
    List<ReportItemRequest> Items,
    List<string>? Recipients = null
);

public record ReportItemRequest(
    string ProductNo,
    string ProductName,
    int Qty,
    string? DamageType
);

public record ReportDto(
    int Id,
    string ReportNo,
    string StoreCode,
    string Type,
    string Status,
    string TplNo,
    string? WaybillNo,
    DateTime ShipmentDate,
    string? Notes,
    int CreatedById,
    string CreatedByName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int ResendCount,
    List<ReportItemDto> Items,
    List<ReportActionDto> Actions,
    EmailLogDto? LastEmail,
    List<string> Recipients
);

public record ReportListItemDto(
    int Id,
    string ReportNo,
    string StoreCode,
    string Type,
    string Status,
    string TplNo,
    int ItemCount,
    DateTime LastActionTime,
    DateTime? LastEmailSentAt,
    string EmailState, // "NotSent", "Sent", "Failed"
    string LastActionType
);

public record ReportItemDto(
    int Id,
    string ProductNo,
    string ProductName,
    int Qty,
    string? DamageType,
    string? PhotoUrl
);

public record ReportActionDto(
    int Id,
    string ActionType,
    string ActorName,
    string? Message,
    DateTime CreatedAt
);

public record EmailLogDto(
    int Id,
    string To,
    string Subject,
    string Body,
    DateTime? SentAt
);

public record PreviewEmailResponse(
    string Subject,
    string Body
);

// Action DTOs
public record SendEmailRequest(
    bool SendViaSmtp = true
);

public record SendEmailResponse(
    string Subject,
    string Body,
    bool Sent
);

public record AcceptReportRequest();

public record RejectReportRequest(
    string RejectionReason,
    string? Note
);

public record ReviseResendRequest();

public record CloseReportRequest();

// List/Search DTOs
public record ReportListRequest(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? Status = null,
    string? Type = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 20
);

public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
