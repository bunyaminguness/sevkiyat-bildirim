using Microsoft.AspNetCore.Mvc;
using SevkiyatBildirimApi.DTOs;
using SevkiyatBildirimApi.Services;

namespace SevkiyatBildirimApi.Controllers;

[ApiController]
[Route("api/system")]
public class SystemController : ControllerBase
{
    private readonly IBusinessHoursService _businessHoursService;

    public SystemController(IBusinessHoursService businessHoursService)
    {
        _businessHoursService = businessHoursService;
    }

    [HttpGet("status")]
    public ActionResult<SystemStatusResponse> GetStatus()
    {
        var isWithinHours = _businessHoursService.IsWithinHours(DateTime.UtcNow);
        var hoursInfo = _businessHoursService.GetBusinessHoursInfo();

        var response = new SystemStatusResponse(
            isWithinHours,
            new BusinessHoursDto(
                hoursInfo.Start,
                hoursInfo.End,
                hoursInfo.TimeZone,
                hoursInfo.Days
            ),
            DateTime.UtcNow
        );

        return Ok(response);
    }
}
