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
        if (!_enabled)
            return true;

        try
        {
            // Convert UTC to target timezone
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(_timeZone);
            var localTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, timeZone);
            
            // Check day of week
            if (!_allowedDays.Contains(localTime.DayOfWeek))
                return false;
            
            var currentTime = localTime.TimeOfDay;
            
            // Handle overnight windows (e.g., 22:00 - 06:00)
            if (_end < _start)
            {
                return currentTime >= _start || currentTime < _end;
            }
            
            // Normal day window (e.g., 09:00 - 18:00)
            return currentTime >= _start && currentTime < _end;
        }
        catch
        {
            // If timezone conversion fails, allow access (fail open)
            return true;
        }
    }

    public BusinessHoursInfo GetBusinessHoursInfo()
    {
        var daysConfig = _configuration.GetSection("BusinessHours:Days").Get<string[]>() 
            ?? new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        
        return new BusinessHoursInfo(
            _configuration["BusinessHours:Start"] ?? "09:00",
            _configuration["BusinessHours:End"] ?? "18:00",
            _timeZone,
            daysConfig
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
