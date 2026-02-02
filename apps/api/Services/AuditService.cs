using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Services;

public interface IAuditService
{
    Task LogActionAsync(int reportId, string actionType, int actorId, string actorName, string? message = null);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;

    public AuditService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogActionAsync(int reportId, string actionType, int actorId, string actorName, string? message = null)
    {
        var action = new ReportAction
        {
            ReportId = reportId,
            ActionType = actionType,
            ActorId = actorId,
            ActorName = actorName,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReportActions.Add(action);
        await _context.SaveChangesAsync();
    }
}
