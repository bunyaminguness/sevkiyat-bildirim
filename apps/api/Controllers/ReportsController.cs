using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Services;
using SevkiyatBildirimApi.Models;
using SevkiyatBildirimApi.Middleware;
using System.Security.Claims;

namespace SevkiyatBildirimApi.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IEmailTemplateService _emailTemplateService;
    private readonly IConfiguration _configuration;

    public ReportsController(
        IReportService reportService,
        IEmailTemplateService emailTemplateService,
        IConfiguration configuration)
    {
        _reportService = reportService;
        _emailTemplateService = emailTemplateService;
        _configuration = configuration;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string GetUserName() => User.FindFirstValue(ClaimTypes.Name)!;

    [HttpGet]
    public async Task<IActionResult> GetReports([FromQuery] ReportListRequest request)
    {
        var result = await _reportService.GetReportsAsync(request);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReport(int id)
    {
        var report = await _reportService.GetReportByIdAsync(id);
        if (report == null)
            return NotFound(new { message_tr = "Rapor bulunamadı" });

        return Ok(report);
    }

    [HttpPost]
    [BusinessHours]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        try
        {
            // 1. Validation
            if (string.IsNullOrWhiteSpace(request.StoreCode))
                return BadRequest(new { message_tr = "Mağaza kodu zorunludur" });

            if (string.IsNullOrWhiteSpace(request.TplNo))
                return BadRequest(new { message_tr = "TPL No zorunludur" });

            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { message_tr = "En az bir ürün eklenmelidir" });

            foreach (var item in request.Items)
            {
                if (string.IsNullOrWhiteSpace(item.ProductNo) || string.IsNullOrWhiteSpace(item.ProductName))
                    return BadRequest(new { message_tr = "Ürün bilgileri eksik (Kod veya Ad)" });
                
                if (item.Qty <= 0)
                    return BadRequest(new { message_tr = "Ürün adedi 0'dan büyük olmalıdır" });
            }

            // 2. Execution
            var report = await _reportService.CreateReportAsync(request, GetUserId(), GetUserName());
            return CreatedAtAction(nameof(GetReport), new { id = report.Id }, report);
        }
        catch (Exception ex)
        {
            // Log the full exception structure
            Console.WriteLine($"[CreateReport Error] {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[Inner Exception] {ex.InnerException.Message}");
                Console.WriteLine(ex.InnerException.StackTrace);
            }

            // Return 400 or 500 based on error type
            if (ex is InvalidOperationException || ex is ArgumentException)
            {
                return BadRequest(new { message_tr = ex.Message });
            }

            return StatusCode(500, new { message_tr = "Rapor oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.", details = ex.Message });
        }
    }

    [HttpPost("email-preview")]
    public ActionResult<EmailPreviewResponse> GetEmailPreview([FromBody] EmailPreviewRequest request)
    {
        // Map request to Report model (temporary for preview generation)
        var report = new Report
        {
            ReportNo = request.ReportNo ?? "TASLAK",
            StoreCode = request.StoreCode ?? "[MAĞAZA KODU]",
            TplNo = request.TplNo ?? "[TPL NO]",
            WaybillNo = request.WaybillNo,
            ShipmentDate = request.ShipmentDate,
            Type = request.Type,
            Status = "Draft", // Preview is always draft context
            Notes = request.Notes,
            // Map items
            Items = request.Items.Select(i => new ReportItem 
            {
                ProductNo = i.ProductNo,
                ProductName = i.ProductName,
                Qty = i.Qty,
                DamageType = i.DamageType
            }).ToList()
        };

        var subject = _emailTemplateService.GenerateEmailSubject(report);
        var body = _emailTemplateService.GenerateEmailBody(report);
        
        // Determine default recipient if not provided
        var recipient = request.RecipientEmail;
        if (string.IsNullOrEmpty(recipient))
        {
            recipient = _configuration["Email:DefaultRecipient"];
        }

        return Ok(new EmailPreviewResponse(subject, body, recipient ?? ""));
    }

    [HttpGet("recipient-options")]
    public ActionResult<List<RecipientOption>> GetRecipientOptions()
    {
        var recipients = _configuration.GetSection("Email:PreconfiguredRecipients").Get<List<RecipientOption>>();
        return Ok(recipients ?? new List<RecipientOption>());
    }

    [HttpPut("{id}")]
    [BusinessHours]
    public async Task<IActionResult> UpdateReport(int id, [FromBody] UpdateReportRequest request)
    {
        try
        {
            var report = await _reportService.UpdateReportAsync(id, request, GetUserId(), GetUserName());
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("{id}/send")]
    [BusinessHours]
    public async Task<IActionResult> SendReport(int id, [FromBody] SendEmailRequest? request = null)
    {
        try
        {
            var sendViaSmtp = request?.SendViaSmtp ?? true;
            var result = await _reportService.SendReportAsync(id, GetUserId(), GetUserName(), sendViaSmtp);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("{id}/accept")]
    [BusinessHours]
    public async Task<IActionResult> AcceptReport(int id)
    {
        try
        {
            var report = await _reportService.AcceptReportAsync(id, GetUserId(), GetUserName());
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    [BusinessHours]
    public async Task<IActionResult> RejectReport(int id, [FromBody] RejectReportRequest request)
    {
        try
        {
            var report = await _reportService.RejectReportAsync(id, request, GetUserId(), GetUserName());
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("{id}/revise-resend")]
    [BusinessHours]
    public async Task<IActionResult> ReviseAndResend(int id, [FromBody] SendEmailRequest? request = null)
    {
        try
        {
            var sendViaSmtp = request?.SendViaSmtp ?? true;
            var result = await _reportService.ReviseAndResendAsync(id, GetUserId(), GetUserName(), sendViaSmtp);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }

    [HttpPost("{id}/close")]
    [BusinessHours]
    public async Task<IActionResult> CloseReport(int id)
    {
        try
        {
            var report = await _reportService.CloseReportAsync(id, GetUserId(), GetUserName());
            return Ok(report);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message_tr = ex.Message });
        }
    }
}
