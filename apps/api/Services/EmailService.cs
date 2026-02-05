using SevkiyatBildirimApi.Models;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace SevkiyatBildirimApi.Services;

public record EmailAttachment(string FileName, byte[] Content, string ContentType);

public interface IEmailService
{
    (string Subject, string Body) GenerateEmailContent(Report report);
    Task<bool> SendEmailAsync(string to, string subject, string body, string? googleRefreshToken = null, List<EmailAttachment>? attachments = null);
    Task SendReportEmailAsync(Report report, User? currentUser);
    Task<List<EmailAttachment>> FetchReportAttachmentsAsync(Report report);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly IEmailTemplateService _emailTemplateService;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger,
        IEmailTemplateService emailTemplateService,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _emailTemplateService = emailTemplateService;
        _httpClientFactory = httpClientFactory;
    }

    public (string Subject, string Body) GenerateEmailContent(Report report)
    {
        return (_emailTemplateService.GenerateEmailSubject(report), _emailTemplateService.GenerateEmailBody(report));
    }

    public async Task<List<EmailAttachment>> FetchReportAttachmentsAsync(Report report)
    {
        var attachments = new List<EmailAttachment>();
        if (report.Items == null) return attachments;

        using var client = _httpClientFactory.CreateClient();
        foreach (var item in report.Items)
        {
            if (!string.IsNullOrEmpty(item.PhotoUrl))
            {
                try
                {
                    var response = await client.GetAsync(item.PhotoUrl);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsByteArrayAsync();
                        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
                        
                        // Create a meaningful filename
                        var extension = contentType switch
                        {
                            "image/jpeg" => ".jpg",
                            "image/png" => ".png",
                            "image/gif" => ".gif",
                            "application/pdf" => ".pdf",
                            _ => ""
                        };
                        
                        var fileName = $"urun_{item.ProductNo}{extension}";
                        attachments.Add(new EmailAttachment(fileName, content, contentType));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch attachment from {Url}", item.PhotoUrl);
                }
            }
        }
        return attachments;
    }

    public async Task SendReportEmailAsync(Report report, User? currentUser)
    {
        var subject = _emailTemplateService.GenerateEmailSubject(report);
        var body = _emailTemplateService.GenerateEmailBody(report);
        var attachments = await FetchReportAttachmentsAsync(report);

        // Determine recipients
        var toRecipients = new List<string>();
        
        // 1. Use report-specific recipient if available
        if (!string.IsNullOrEmpty(report.RecipientEmail))
        {
            toRecipients.Add(report.RecipientEmail);
        }
        // 2. Fallback to default recipient if configured
        else
        {
            var defaultRecipient = _configuration["Email:DefaultRecipient"];
            if (!string.IsNullOrEmpty(defaultRecipient))
            {
                toRecipients.Add(defaultRecipient);
            }
        }
        
        // 3. Always include creator if they have an email (as CC mechanism)
        if (currentUser != null && !string.IsNullOrEmpty(currentUser.Email))
        {
            toRecipients.Add(currentUser.Email);
        }
 
        if (!toRecipients.Any())
        {
            _logger.LogWarning("No recipients found for report {ReportId}", report.Id);
            return;
        }

        var toAddresses = toRecipients.Distinct().ToList();
        
        foreach (var recipient in toAddresses)
        {
            string? googleRefreshToken = null;
            if (currentUser != null && !string.IsNullOrEmpty(currentUser.GoogleRefreshToken))
            {
                googleRefreshToken = currentUser.GoogleRefreshToken;
            }

            await SendEmailAsync(recipient, subject, body, googleRefreshToken, attachments);
        }
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, string? googleRefreshToken = null, List<EmailAttachment>? attachments = null)
    {
        if (!string.IsNullOrEmpty(googleRefreshToken))
        {
            var sentViaGmail = await SendViaGmailAsync(to, subject, body, googleRefreshToken, attachments);
            if (sentViaGmail) return true;
            
            _logger.LogWarning("Gmail send failed for user with token. Aborting to avoid sender mismatch.");
            return false; 
        }

        return await SendViaSmtpAsync(to, subject, body, attachments);
    }

    private async Task<bool> SendViaGmailAsync(string to, string subject, string body, string refreshToken, List<EmailAttachment>? attachments)
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                _logger.LogWarning("Google ClientId/Secret missing, skipping Gmail send");
                return false;
            }

            var tokenResponse = new Google.Apis.Auth.OAuth2.Responses.TokenResponse
            {
                RefreshToken = refreshToken
            };

            var credential = new Google.Apis.Auth.OAuth2.UserCredential(
                new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow(
                    new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow.Initializer
                    {
                        ClientSecrets = new Google.Apis.Auth.OAuth2.ClientSecrets
                        {
                            ClientId = clientId,
                            ClientSecret = clientSecret
                        }
                    }),
                "user",
                tokenResponse
            );

            if (credential.Token.IsStale)
            {
                 await credential.RefreshTokenAsync(CancellationToken.None);
            }

            using var service = new Google.Apis.Gmail.v1.GmailService(new Google.Apis.Services.BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "SevkiyatBildirim"
            });

            var msg = new Google.Apis.Gmail.v1.Data.Message();
            msg.Raw = Base64UrlEncode(CreateMimeMessage(to, subject, body, attachments));

            await service.Users.Messages.Send(msg, "me").ExecuteAsync();
            
            _logger.LogInformation("Email sent via Gmail API to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Gmail API to {To}", to);
            return false;
        }
    }

    private async Task<bool> SendViaSmtpAsync(string to, string subject, string body, List<EmailAttachment>? attachments)
    {
        var smtpEnabled = _configuration.GetValue<bool>("Email:SmtpEnabled");
        if (!smtpEnabled)
        {
            _logger.LogInformation("SMTP disabled, email not sent. Subject: {Subject}", subject);
            return false;
        }

        try
        {
            var host = _configuration["Email:SmtpHost"];
            var port = _configuration.GetValue<int>("Email:SmtpPort");
            var username = _configuration["Email:SmtpUsername"];
            var password = _configuration["Email:SmtpPassword"];
            var from = _configuration["Email:FromAddress"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(from))
            {
                _logger.LogWarning("SMTP configuration incomplete, email not sent");
                return false;
            }

            using var smtpClient = new SmtpClient(host, port)
            {
                EnableSsl = _configuration.GetValue<bool>("Email:SmtpUseSsl", true),
                Credentials = new NetworkCredential(username, password)
            };

            using var message = new MailMessage(from, to, subject, body);
            
            if (attachments != null)
            {
                foreach (var att in attachments)
                {
                    message.Attachments.Add(new Attachment(new MemoryStream(att.Content), att.FileName, att.ContentType));
                }
            }
            
            await smtpClient.SendMailAsync(message);
            _logger.LogInformation("Email sent via SMTP to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SMTP to {To}", to);
            return false;
        }
    }

    private string CreateMimeMessage(string to, string subject, string body, List<EmailAttachment>? attachments)
    {
        if (attachments == null || !attachments.Any())
        {
            return $"To: {to}\r\n" +
                   $"Subject: =?utf-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))}?=\r\n" +
                   "Content-Type: text/plain; charset=utf-8\r\n" +
                   "\r\n" +
                   body;
        }

        var boundary = Guid.NewGuid().ToString();
        var sb = new StringBuilder();
        
        sb.AppendLine($"To: {to}");
        sb.AppendLine($"Subject: =?utf-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))}?=");
        sb.AppendLine($"Content-Type: multipart/mixed; boundary=\"{boundary}\"");
        sb.AppendLine();
        
        sb.AppendLine($"--{boundary}");
        sb.AppendLine("Content-Type: text/plain; charset=utf-8");
        sb.AppendLine();
        sb.AppendLine(body);
        
        foreach (var attachment in attachments)
        {
            sb.AppendLine();
            sb.AppendLine($"--{boundary}");
            sb.AppendLine($"Content-Type: {attachment.ContentType}");
            sb.AppendLine("Content-Transfer-Encoding: base64");
            sb.AppendLine($"Content-Disposition: attachment; filename=\"{attachment.FileName}\"");
            sb.AppendLine();
            sb.AppendLine(Convert.ToBase64String(attachment.Content));
        }
        
        sb.AppendLine();
        sb.AppendLine($"--{boundary}--");
        
        return sb.ToString();
    }

    private string Base64UrlEncode(string input)
    {
        var inputBytes = Encoding.UTF8.GetBytes(input);
        return Convert.ToBase64String(inputBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", "");
    }
}
