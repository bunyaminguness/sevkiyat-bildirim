using SevkiyatBildirimApi.Models;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace SevkiyatBildirimApi.Services;

public interface IEmailService
{
    (string Subject, string Body) GenerateEmailContent(Report report);
    Task<bool> SendEmailAsync(string to, string subject, string body, string? googleRefreshToken = null);
    Task SendReportEmailAsync(Report report, User? currentUser);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly IEmailTemplateService _emailTemplateService;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger,
        IEmailTemplateService emailTemplateService)
    {
        _configuration = configuration;
        _logger = logger;
        _emailTemplateService = emailTemplateService;
    }

    public (string Subject, string Body) GenerateEmailContent(Report report)
    {
        return (_emailTemplateService.GenerateEmailSubject(report), _emailTemplateService.GenerateEmailBody(report));
    }

    public async Task SendReportEmailAsync(Report report, User? currentUser)
    {
        var subject = _emailTemplateService.GenerateEmailSubject(report);
        var body = _emailTemplateService.GenerateEmailBody(report);

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
        
        // Use the first recipient as primary TO, others could be logic for CC but for now we send individual emails or just TO the first one
        // Simpler approach: Send to all unique recipients
        foreach (var recipient in toAddresses)
        {
            // Try Gmail first if user has token (only applies if currentUser is the sender)
            // But here the "sender" logic is tricky. 
            // If the current user has a Google Refresh Token, use it.
            
            string? googleRefreshToken = null;
            if (currentUser != null && !string.IsNullOrEmpty(currentUser.GoogleRefreshToken))
            {
                googleRefreshToken = currentUser.GoogleRefreshToken;
            }

            await SendEmailAsync(recipient, subject, body, googleRefreshToken);
        }
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, string? googleRefreshToken = null)
    {
        // If a refresh token is provided, we MUST try to send via Gmail.
        // If it fails, we should NOT fall back to SMTP silently, because that causes the "Sender Mismatch" issue.
        // The user expects the email to come from THEM.
        if (!string.IsNullOrEmpty(googleRefreshToken))
        {
            var sentViaGmail = await SendViaGmailAsync(to, subject, body, googleRefreshToken);
            if (sentViaGmail) return true;
            
            // If Gmail failed, stop here. Do not fallback.
            _logger.LogWarning("Gmail send failed for user with token. Aborting to avoid sender mismatch.");
            return false; 
        }

        // Only use SMTP if no token was provided (e.g. system emails or non-Google users)
        return await SendViaSmtpAsync(to, subject, body);
    }

    private async Task<bool> SendViaGmailAsync(string to, string subject, string body, string refreshToken)
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

            // Force token refresh if needed (handling is partly automatic, but ensure Scope)
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
            msg.Raw = Base64UrlEncode(CreateMimeMessage(to, subject, body));

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

    private async Task<bool> SendViaSmtpAsync(string to, string subject, string body)
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

    private string CreateMimeMessage(string to, string subject, string body)
    {
        // Simple MIME message construction
        var message = $"To: {to}\r\n" +
                      $"Subject: =?utf-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))}?=\r\n" +
                      "Content-Type: text/plain; charset=utf-8\r\n" +
                      "\r\n" +
                      body;
        return message;
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
