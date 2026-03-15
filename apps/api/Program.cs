using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SevkiyatBildirimApi.Data;
using SevkiyatBildirimApi.Middleware;
using SevkiyatBildirimApi.Services;
using SevkiyatBildirimApi.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Forwarded Headers (for Nginx/Proxy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedHost | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Authentication & Authorization
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };

    // Read token from cookie as fallback
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token))
            {
                context.Token = context.Request.Cookies["auth_token"];
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateReportRequestValidator>();

// Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOAuthService, OAuthService>();
builder.Services.AddScoped<IMagicLinkService, MagicLinkService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEmailTemplateService, EmailTemplateService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IReportNumberGenerator, ReportNumberGenerator>();
builder.Services.AddSingleton<IBusinessHoursService, BusinessHoursService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebApp", policy =>
    {
        // Read allowed origins from configuration, fallback to localhost for dev
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000", "http://localhost:3001" };
        
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseForwardedHeaders(); // Ensure this is early
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowWebApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-migrate database in all environments
// if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while migrating the database");
    }

    // Seed allowed users from configuration
    try
    {
        var adminEmails = builder.Configuration.GetSection("AllowedUsers:AdminEmails").Get<string[]>();
        if (adminEmails != null && adminEmails.Length > 0)
        {
            foreach (var email in adminEmails)
            {
                var normalizedEmail = email.ToLowerInvariant();
                var existingAllowedUser = await dbContext.AllowedUsers
                    .FirstOrDefaultAsync(au => au.Email == normalizedEmail);

                if (existingAllowedUser == null)
                {
                    dbContext.AllowedUsers.Add(new SevkiyatBildirimApi.Models.AllowedUser
                    {
                        Id = Guid.NewGuid(),
                        Email = normalizedEmail,
                        Role = SevkiyatBildirimApi.Models.UserRole.Admin,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                    app.Logger.LogInformation("Seeded admin user: {Email}", email);
                }
            }
            await dbContext.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while seeding allowed users");
    }

    // Update gunesbunyamin004@gmail.com to Admin role
    try
    {
        var gunesUser = await dbContext.AllowedUsers
            .FirstOrDefaultAsync(au => au.Email == "gunesbunyamin004@gmail.com");
        
        if (gunesUser != null && gunesUser.Role != SevkiyatBildirimApi.Models.UserRole.Admin)
        {
            gunesUser.Role = SevkiyatBildirimApi.Models.UserRole.Admin;
            await dbContext.SaveChangesAsync();
            app.Logger.LogInformation("Updated gunesbunyamin004@gmail.com to Admin role");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while updating user role");
    }
}

app.Run();
