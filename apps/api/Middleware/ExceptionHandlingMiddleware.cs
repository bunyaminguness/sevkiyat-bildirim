using System.Net;
using System.Text.Json;
using FluentValidation;

namespace SevkiyatBildirimApi.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred");

        context.Response.ContentType = "application/json";

        object response = exception switch
        {
            ValidationException validationEx => new
            {
                code = "VALIDATION_ERROR",
                message_tr = "Lütfen tüm zorunlu alanları doldurun",
                fieldErrors = validationEx.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => ToCamelCase(g.Key), g => g.First().ErrorMessage)
            },
            InvalidOperationException invalidOpEx => new
            {
                code = "INVALID_OPERATION",
                message_tr = invalidOpEx.Message
            },
            UnauthorizedAccessException => new
            {
                code = "UNAUTHORIZED",
                message_tr = "Bu işlem için yetkiniz yok"
            },
            _ => new
            {
                code = "INTERNAL_ERROR",
                message_tr = "Bir hata oluştu. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin."
            }
        };

        context.Response.StatusCode = exception switch
        {
            ValidationException => (int)HttpStatusCode.BadRequest,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str) || char.IsLower(str[0]))
            return str;

        return char.ToLower(str[0]) + str.Substring(1);
    }
}
