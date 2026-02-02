namespace SevkiyatBildirimApi.Services;

public interface IBusinessHoursService
{
    bool IsWithinHours(DateTime utcNow);
    BusinessHoursInfo GetBusinessHoursInfo();
}

public record BusinessHoursInfo(
    string Start,
    string End,
    string TimeZone,
    string[] Days
);
