using Microsoft.EntityFrameworkCore;
using SevkiyatBildirimApi.Models;

namespace SevkiyatBildirimApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<ReportItem> ReportItems => Set<ReportItem>();
    public DbSet<ReportAction> ReportActions => Set<ReportAction>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<MagicLinkToken> MagicLinkTokens => Set<MagicLinkToken>();
    public DbSet<AllowedUser> AllowedUsers => Set<AllowedUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.ProviderId); // For OAuth lookups
            
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash); // Nullable for OAuth users
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.StoreCode).HasMaxLength(50);
            entity.Property(e => e.ProviderId).HasMaxLength(255);
            entity.Property(e => e.ProfileImageUrl).HasMaxLength(500);
        });

        // Report configuration
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ReportNo).IsUnique();
            entity.HasIndex(e => e.StoreCode);
            entity.HasIndex(e => e.TplNo);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ShipmentDate);
            
            entity.Property(e => e.ReportNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.StoreCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TplNo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.WaybillNo).HasMaxLength(100);
            
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ReportItem configuration
        modelBuilder.Entity<ReportItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductNo);
            
            entity.Property(e => e.ProductNo).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.DamageType).HasMaxLength(100);
            entity.Property(e => e.PhotoUrl).HasMaxLength(500);
            
            entity.HasOne(e => e.Report)
                .WithMany(r => r.Items)
                .HasForeignKey(e => e.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ReportAction configuration
        modelBuilder.Entity<ReportAction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.ActionType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ActorName).IsRequired().HasMaxLength(200);
            
            entity.HasOne(e => e.Report)
                .WithMany(r => r.Actions)
                .HasForeignKey(e => e.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EmailLog configuration
        modelBuilder.Entity<EmailLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.To).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Body).IsRequired();
            entity.Property(e => e.ProviderMessageId).HasMaxLength(200);
            
            entity.HasOne(e => e.Report)
                .WithMany(r => r.EmailLogs)
                .HasForeignKey(e => e.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MagicLinkToken configuration
        modelBuilder.Entity<MagicLinkToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(100);
        });

        // AllowedUser configuration
        modelBuilder.Entity<AllowedUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Role).IsRequired();
            entity.Property(e => e.StoreCode).HasMaxLength(50);
        });

        // Seed data
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed demo users
        // Password for both: ***REMOVED***
        // Pre-computed BCrypt hash for "***REMOVED***" - static to avoid migration warnings
        const string hashedPassword = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        
        // Static dates for seed data
        var baseDate = new DateTime(2026, 1, 26, 12, 0, 0, DateTimeKind.Utc);
        
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Email = "***REMOVED***",
                PasswordHash = hashedPassword,
                Role = "Manager",
                DisplayName = "Mağaza Müdürü",
                StoreCode = "IST001",
                CreatedAt = baseDate
            },
            new User
            {
                Id = 2,
                Email = "assistant@demo.com",
                PasswordHash = hashedPassword,
                Role = "Assistant",
                DisplayName = "Mağaza Yardımcısı",
                StoreCode = "IST001",
                CreatedAt = baseDate
            }
        );

        // Seed sample reports
        modelBuilder.Entity<Report>().HasData(
            new Report
            {
                Id = 1,
                ReportNo = "SK-2026-000001",
                StoreCode = "IST001",
                Type = "Missing",
                Status = "Sent",
                TplNo = "TPL20260125001",
                WaybillNo = "WB123456",
                ShipmentDate = new DateTime(2026, 1, 21, 0, 0, 0, DateTimeKind.Utc),
                Notes = "İlk sevkiyat eksik ürün bildirimi",
                CreatedById = 1,
                CreatedAt = new DateTime(2026, 1, 21, 10, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 21, 10, 0, 0, DateTimeKind.Utc),
                ResendCount = 0
            },
            new Report
            {
                Id = 2,
                ReportNo = "SK-2026-000002",
                StoreCode = "IST001",
                Type = "Damaged",
                Status = "Rejected",
                TplNo = "TPL20260126001",
                WaybillNo = "WB123457",
                ShipmentDate = new DateTime(2026, 1, 23, 0, 0, 0, DateTimeKind.Utc),
                Notes = "Hasarlı ürün talebi reddedildi, eksik bilgi var",
                CreatedById = 2,
                CreatedAt = new DateTime(2026, 1, 23, 14, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 24, 9, 0, 0, DateTimeKind.Utc),
                ResendCount = 0
            },
            new Report
            {
                Id = 3,
                ReportNo = "SK-2026-000003",
                StoreCode = "IST001",
                Type = "Missing",
                Status = "Draft",
                TplNo = "TPL20260131001",
                ShipmentDate = new DateTime(2026, 1, 26, 0, 0, 0, DateTimeKind.Utc),
                Notes = "Taslak bildirim",
                CreatedById = 1,
                CreatedAt = baseDate,
                UpdatedAt = baseDate,
                ResendCount = 0
            }
        );

        // Seed report items
        modelBuilder.Entity<ReportItem>().HasData(
            // Report 1 items
            new ReportItem
            {
                Id = 1,
                ReportId = 1,
                ProductNo = "PRD001",
                ProductName = "Ürün A",
                Qty = 5,
                CreatedAt = new DateTime(2026, 1, 21, 10, 0, 0, DateTimeKind.Utc)
            },
            new ReportItem
            {
                Id = 2,
                ReportId = 1,
                ProductNo = "PRD002",
                ProductName = "Ürün B",
                Qty = 3,
                CreatedAt = new DateTime(2026, 1, 21, 10, 0, 0, DateTimeKind.Utc)
            },
            // Report 2 items
            new ReportItem
            {
                Id = 3,
                ReportId = 2,
                ProductNo = "PRD003",
                ProductName = "Ürün C",
                Qty = 2,
                DamageType = "Kırık",
                CreatedAt = new DateTime(2026, 1, 23, 14, 0, 0, DateTimeKind.Utc)
            },
            // Report 3 items
            new ReportItem
            {
                Id = 4,
                ReportId = 3,
                ProductNo = "PRD004",
                ProductName = "Ürün D",
                Qty = 10,
                CreatedAt = baseDate
            }
        );

        // Seed report actions
        modelBuilder.Entity<ReportAction>().HasData(
            new ReportAction
            {
                Id = 1,
                ReportId = 1,
                ActionType = "CREATED",
                ActorId = 1,
                ActorName = "Mağaza Müdürü",
                Message = "Rapor oluşturuldu",
                CreatedAt = new DateTime(2026, 1, 21, 10, 0, 0, DateTimeKind.Utc)
            },
            new ReportAction
            {
                Id = 2,
                ReportId = 1,
                ActionType = "SENT",
                ActorId = 1,
                ActorName = "Mağaza Müdürü",
                Message = "Email gönderildi",
                CreatedAt = new DateTime(2026, 1, 21, 11, 0, 0, DateTimeKind.Utc)
            },
            new ReportAction
            {
                Id = 3,
                ReportId = 2,
                ActionType = "CREATED",
                ActorId = 2,
                ActorName = "Mağaza Yardımcısı",
                Message = "Rapor oluşturuldu",
                CreatedAt = new DateTime(2026, 1, 23, 14, 0, 0, DateTimeKind.Utc)
            },
            new ReportAction
            {
                Id = 4,
                ReportId = 2,
                ActionType = "SENT",
                ActorId = 2,
                ActorName = "Mağaza Yardımcısı",
                Message = "Email gönderildi",
                CreatedAt = new DateTime(2026, 1, 23, 15, 0, 0, DateTimeKind.Utc)
            },
            new ReportAction
            {
                Id = 5,
                ReportId = 2,
                ActionType = "REJECTED",
                ActorId = 2,
                ActorName = "Mağaza Yardımcısı",
                Message = "Red sebebi: Fotoğraf eksik",
                CreatedAt = new DateTime(2026, 1, 24, 9, 0, 0, DateTimeKind.Utc)
            },
            new ReportAction
            {
                Id = 6,
                ReportId = 3,
                ActionType = "CREATED",
                ActorId = 1,
                ActorName = "Mağaza Müdürü",
                Message = "Rapor oluşturuldu",
                CreatedAt = baseDate
            }
        );

        // Seed email logs
        modelBuilder.Entity<EmailLog>().HasData(
            new EmailLog
            {
                Id = 1,
                ReportId = 1,
                To = "lojistik@example.com",
                Subject = "SK-2026-000001 | Eksik Ürün Bildirimi | TPL TPL20260125001 | Mağaza IST001",
                Body = "Rapor No: SK-2026-000001\nMağaza: IST001\nTPL No: TPL20260125001\nİrsaliye No: WB123456\n\nEksik Ürünler:\n- PRD001: Ürün A (Miktar: 5)\n- PRD002: Ürün B (Miktar: 3)\n\nNotlar: İlk sevkiyat eksik ürün bildirimi",
                SentAt = new DateTime(2026, 1, 21, 11, 0, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 1, 21, 11, 0, 0, DateTimeKind.Utc)
            },
            new EmailLog
            {
                Id = 2,
                ReportId = 2,
                To = "lojistik@example.com",
                Subject = "SK-2026-000002 | Hasarlı Ürün Bildirimi | TPL TPL20260126001 | Mağaza IST001",
                Body = "Rapor No: SK-2026-000002\nMağaza: IST001\nTPL No: TPL20260126001\nİrsaliye No: WB123457\n\nHasarlı Ürünler:\n- PRD003: Ürün C (Miktar: 2, Hasar: Kırık)\n\nNotlar: Hasarlı ürün talebi reddedildi, eksik bilgi var",
                SentAt = new DateTime(2026, 1, 23, 15, 0, 0, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 1, 23, 15, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
