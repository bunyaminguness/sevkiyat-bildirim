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
        
        var typeWord = report.Type == "Missing" ? "eksik" : "hasarlı";
        var typeWordTitle = report.Type == "Missing" ? "Eksik" : "Hasarlı";

        sb.AppendLine("Sayın Yetkili,");
        sb.AppendLine();
        sb.AppendLine($"Aşağıda bilgileri yer alan sevkiyat kapsamında, mağazamıza teslim edilmesi gereken bazı ürünlerin {typeWord} olarak ulaştığı tespit edilmiştir.");
        sb.AppendLine();
        sb.AppendLine("İlgili sevkiyata ait detaylar sistem kayıtlarımızda ve ekte sunulan görsellerde açıkça yer almaktadır.");
        sb.AppendLine();
        sb.AppendLine($"{typeWordTitle} teslimatın incelenerek gerekli aksiyonların alınmasını, tarafımıza geri dönüş sağlanmasını rica ederiz.");
        sb.AppendLine();
        sb.AppendLine("Bilgilerinize sunar, iyi çalışmalar dileriz.");
        sb.AppendLine();
        sb.AppendLine("Saygılarımızla.");
        sb.AppendLine();
        sb.AppendLine("--------------------------------------------------");
        sb.AppendLine("BİLDİRİM DETAYLARI");
        sb.AppendLine("--------------------------------------------------");
        sb.AppendLine($"Rapor No: {report.ReportNo ?? "TASLAK"}");
        sb.AppendLine($"Mağaza: {report.StoreCode}");
        sb.AppendLine($"TPL No: {report.TplNo}");
        
        if (!string.IsNullOrEmpty(report.WaybillNo))
            sb.AppendLine($"İrsaliye No: {report.WaybillNo}");
            
        sb.AppendLine($"Sevkiyat Tarihi: {report.ShipmentDate:dd.MM.yyyy}");
        sb.AppendLine();
        
        sb.AppendLine($"{typeWordTitle} Ürünler:");
        
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
        
        return sb.ToString();
    }
}

public interface IEmailTemplateService
{
    string GenerateEmailSubject(Report report);
    string GenerateEmailBody(Report report);
}
