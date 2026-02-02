using System.Text;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Services;

public class EmailTemplateService : IEmailTemplateService
{
    public string GenerateEmailSubject(Report report)
    {
        var subject = new StringBuilder();
        
        // Report No
        if (!string.IsNullOrEmpty(report.ReportNo))
            subject.Append(report.ReportNo);
        else
            subject.Append("TASLAK");
            
        // Type
        subject.Append($" | {report.Type}");
        
        // TPL
        if (!string.IsNullOrEmpty(report.TplNo))
            subject.Append($" | TPL {report.TplNo}");
            
        // Store
        if (!string.IsNullOrEmpty(report.StoreCode))
            subject.Append($" | Mağaza {report.StoreCode}");
            
        return subject.ToString();
    }

    public string GenerateEmailBody(Report report)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine($"Rapor No: {report.ReportNo ?? "TASLAK"}");
        sb.AppendLine($"Mağaza: {report.StoreCode}");
        sb.AppendLine($"TPL No: {report.TplNo}");
        
        if (!string.IsNullOrEmpty(report.WaybillNo))
            sb.AppendLine($"İrsaliye No: {report.WaybillNo}");
            
        sb.AppendLine($"Sevkiyat Tarihi: {report.ShipmentDate:dd.MM.yyyy}");
        sb.AppendLine();
        
        var typeLabel = report.Type == "Missing" ? "Eksik" : "Hasarlı";
        sb.AppendLine($"{typeLabel} Ürünler:");
        
        if (report.Items != null && report.Items.Any())
        {
            foreach (var item in report.Items)
            {
                var line = $"- {item.ProductNo} - {item.ProductName} (Miktar: {item.Qty})";
                if (report.Type == "Damaged" && !string.IsNullOrEmpty(item.DamageType))
                {
                    line += $" (Hasar: {item.DamageType})";
                }
                sb.AppendLine(line);
            }
        }
        else
        {
            sb.AppendLine("- (Ürün girilmedi)");
        }
        
        if (!string.IsNullOrEmpty(report.Notes))
        {
            sb.AppendLine();
            sb.AppendLine("Notlar:");
            sb.AppendLine(report.Notes);
        }
        
        return sb.ToString();
    }
}

public interface IEmailTemplateService
{
    string GenerateEmailSubject(Report report);
    string GenerateEmailBody(Report report);
}
