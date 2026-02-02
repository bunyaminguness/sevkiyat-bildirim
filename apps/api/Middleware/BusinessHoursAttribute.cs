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
        var businessHoursService = context.HttpContext.RequestServices
            .GetRequiredService<IBusinessHoursService>();

        var isWithinHours = businessHoursService.IsWithinHours(DateTime.UtcNow);

        if (!isWithinHours)
        {
            var hoursInfo = businessHoursService.GetBusinessHoursInfo();
            var businessHoursDto = new BusinessHoursDto(
                hoursInfo.Start,
                hoursInfo.End,
                hoursInfo.TimeZone,
                hoursInfo.Days
            );

            var errorResponse = new BusinessHoursErrorResponse(
                "outside_business_hours",
                $"Kullanım saatleri dışında işlem yapılamaz. ({hoursInfo.Start}–{hoursInfo.End})",
                businessHoursDto
            );

            context.Result = new ObjectResult(errorResponse)
            {
                StatusCode = 403
            };
        }

        base.OnActionExecuting(context);
    }
}
