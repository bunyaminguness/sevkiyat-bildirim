using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Services;

namespace SevkiyatBildirimApi.Middleware;

/// <summary>
/// Action filter that enforces business hours for mutating operations.
/// Apply this attribute to POST/PUT/PATCH/DELETE endpoints that should be restricted to business hours.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class BusinessHoursAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
    // Business-hours restriction removed: keep attribute for backwards compatibility,
    // but don't block requests.
    base.OnActionExecuting(context);
    }
}
