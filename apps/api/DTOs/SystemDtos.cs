namespace SevkiyatBildirimApi.DTOs;

public record SystemStatusResponse(
    bool IsWithinBusinessHours,
    BusinessHoursDto BusinessHours,
    DateTime ServerTime
);

public record BusinessHoursDto(
    string Start,
    string End,
    string Tz,
    string[] Days
);

public record BusinessHoursErrorResponse(
    string Code,
    string Message,
    BusinessHoursDto BusinessHours
);
