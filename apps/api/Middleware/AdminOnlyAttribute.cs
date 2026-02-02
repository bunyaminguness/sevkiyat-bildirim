using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace SevkiyatBildirimApi.Middleware;

/// <summary>
/// Authorization filter that restricts access to Admin users only
/// </summary>
public class AdminOnlyAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                code = "unauthorized",
                message = "Oturum açmanız gerekiyor."
            });
            return;
        }

        // Use ClaimTypes.Role to match JWT token generation in AuthService
        var roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
        
        // Check if role is Admin (0)
        if (roleClaim != "Admin" && roleClaim != "0")
        {
            context.Result = new ObjectResult(new
            {
                code = "forbidden",
                message = "Bu işlem için yönetici yetkisi gereklidir."
            })
            {
                StatusCode = 403
            };
            return;
        }

        base.OnActionExecuting(context);
    }
}
