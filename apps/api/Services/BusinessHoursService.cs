namespace SevkiyatBildirimApi.Services;

public class BusinessHoursService : IBusinessHoursService
{
    private readonly IConfiguration _configuration;
    private readonly bool _enabled;
    private readonly string _timeZone;
    private readonly TimeSpan _start;
    private readonly TimeSpan _end;
    private readonly HashSet<DayOfWeek> _allowedDays;

    public BusinessHoursService(IConfiguration configuration)
    {
        _configuration = configuration;
        
        _enabled = configuration.GetValue<bool>("BusinessHours:Enabled", true);
        _timeZone = configuration["BusinessHours:TimeZone"] ?? "Europe/Istanbul";
        
        // Parse start and end times
        var startStr = configuration["BusinessHours:Start"] ?? "09:00";
        var endStr = configuration["BusinessHours:End"] ?? "18:00";
        
        _start = TimeSpan.Parse(startStr);
        _end = TimeSpan.Parse(endStr);
        
        // Parse allowed days
        var daysConfig = configuration.GetSection("BusinessHours:Days").Get<string[]>() 
            ?? new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        
        _allowedDays = daysConfig
            .Select(MapDayAbbreviation)
            .ToHashSet();
    }

    public bool IsWithinHours(DateTime utcNow)
    {
    // Business-hours restriction removed: app should be usable 7/24.
    return true;
    }

    public BusinessHoursInfo GetBusinessHoursInfo()
    {
        // Keep response shape for clients, but represent 24/7.
        return new BusinessHoursInfo(
            "00:00",
            "23:59",
            _timeZone,
            new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" }
        );
    }

    private static DayOfWeek MapDayAbbreviation(string abbr) => abbr switch
    {
        "Mon" => DayOfWeek.Monday,
        "Tue" => DayOfWeek.Tuesday,
        "Wed" => DayOfWeek.Wednesday,
        "Thu" => DayOfWeek.Thursday,
        "Fri" => DayOfWeek.Friday,
        "Sat" => DayOfWeek.Saturday,
        "Sun" => DayOfWeek.Sunday,
        _ => throw new ArgumentException($"Invalid day abbreviation: {abbr}")
    };
}
