using SevkiyatBildirimApi.Data;
using Microsoft.EntityFrameworkCore;

namespace SevkiyatBildirimApi.Services;

public interface IReportNumberGenerator
{
    Task<string> GenerateNextReportNumberAsync();
}

public class ReportNumberGenerator : IReportNumberGenerator
{
    private readonly AppDbContext _context;

    public ReportNumberGenerator(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextReportNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"SK-{year}-";
        
        // Get the last report number for this year
        var lastReport = await _context.Reports
            .Where(r => r.ReportNo.StartsWith(prefix))
            .OrderByDescending(r => r.ReportNo)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastReport != null)
        {
            var lastNumberStr = lastReport.ReportNo.Substring(prefix.Length);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"{prefix}{nextNumber:D6}";
    }
}
