using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SevkiyatBildirimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiAuthSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MagicLinkTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Token = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MagicLinkTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StoreCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Provider = table.Column<int>(type: "integer", nullable: false),
                    ProviderId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ProfileImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StoreCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TplNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WaybillNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ShipmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedById = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResendCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportId = table.Column<int>(type: "integer", nullable: false),
                    To = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProviderMessageId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailLogs_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReportActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportId = table.Column<int>(type: "integer", nullable: false),
                    ActionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActorId = table.Column<int>(type: "integer", nullable: false),
                    ActorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportActions_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReportItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportId = table.Column<int>(type: "integer", nullable: false),
                    ProductNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProductName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Qty = table.Column<int>(type: "integer", nullable: false),
                    DamageType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportItems_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "DisplayName", "Email", "LastLoginAt", "PasswordHash", "ProfileImageUrl", "Provider", "ProviderId", "Role", "StoreCode" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), "Mağaza Müdürü", "***REMOVED***", null, "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", null, 0, null, "Manager", "IST001" },
                    { 2, new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), "Mağaza Yardımcısı", "assistant@demo.com", null, "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", null, 0, null, "Assistant", "IST001" }
                });

            migrationBuilder.InsertData(
                table: "Reports",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "Notes", "ReportNo", "ResendCount", "ShipmentDate", "Status", "StoreCode", "TplNo", "Type", "UpdatedAt", "WaybillNo" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 21, 10, 0, 0, 0, DateTimeKind.Utc), 1, "İlk sevkiyat eksik ürün bildirimi", "SK-2026-000001", 0, new DateTime(2026, 1, 21, 0, 0, 0, 0, DateTimeKind.Utc), "Sent", "IST001", "TPL20260125001", "Missing", new DateTime(2026, 1, 21, 10, 0, 0, 0, DateTimeKind.Utc), "WB123456" },
                    { 2, new DateTime(2026, 1, 23, 14, 0, 0, 0, DateTimeKind.Utc), 2, "Hasarlı ürün talebi reddedildi, eksik bilgi var", "SK-2026-000002", 0, new DateTime(2026, 1, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Rejected", "IST001", "TPL20260126001", "Damaged", new DateTime(2026, 1, 24, 9, 0, 0, 0, DateTimeKind.Utc), "WB123457" },
                    { 3, new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), 1, "Taslak bildirim", "SK-2026-000003", 0, new DateTime(2026, 1, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Draft", "IST001", "TPL20260131001", "Missing", new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.InsertData(
                table: "EmailLogs",
                columns: new[] { "Id", "Body", "CreatedAt", "ProviderMessageId", "ReportId", "SentAt", "Subject", "To" },
                values: new object[,]
                {
                    { 1, "Rapor No: SK-2026-000001\nMağaza: IST001\nTPL No: TPL20260125001\nİrsaliye No: WB123456\n\nEksik Ürünler:\n- PRD001: Ürün A (Miktar: 5)\n- PRD002: Ürün B (Miktar: 3)\n\nNotlar: İlk sevkiyat eksik ürün bildirimi", new DateTime(2026, 1, 21, 11, 0, 0, 0, DateTimeKind.Utc), null, 1, new DateTime(2026, 1, 21, 11, 0, 0, 0, DateTimeKind.Utc), "SK-2026-000001 | Eksik Ürün Bildirimi | TPL TPL20260125001 | Mağaza IST001", "lojistik@example.com" },
                    { 2, "Rapor No: SK-2026-000002\nMağaza: IST001\nTPL No: TPL20260126001\nİrsaliye No: WB123457\n\nHasarlı Ürünler:\n- PRD003: Ürün C (Miktar: 2, Hasar: Kırık)\n\nNotlar: Hasarlı ürün talebi reddedildi, eksik bilgi var", new DateTime(2026, 1, 23, 15, 0, 0, 0, DateTimeKind.Utc), null, 2, new DateTime(2026, 1, 23, 15, 0, 0, 0, DateTimeKind.Utc), "SK-2026-000002 | Hasarlı Ürün Bildirimi | TPL TPL20260126001 | Mağaza IST001", "lojistik@example.com" }
                });

            migrationBuilder.InsertData(
                table: "ReportActions",
                columns: new[] { "Id", "ActionType", "ActorId", "ActorName", "CreatedAt", "Message", "ReportId" },
                values: new object[,]
                {
                    { 1, "CREATED", 1, "Mağaza Müdürü", new DateTime(2026, 1, 21, 10, 0, 0, 0, DateTimeKind.Utc), "Rapor oluşturuldu", 1 },
                    { 2, "SENT", 1, "Mağaza Müdürü", new DateTime(2026, 1, 21, 11, 0, 0, 0, DateTimeKind.Utc), "Email gönderildi", 1 },
                    { 3, "CREATED", 2, "Mağaza Yardımcısı", new DateTime(2026, 1, 23, 14, 0, 0, 0, DateTimeKind.Utc), "Rapor oluşturuldu", 2 },
                    { 4, "SENT", 2, "Mağaza Yardımcısı", new DateTime(2026, 1, 23, 15, 0, 0, 0, DateTimeKind.Utc), "Email gönderildi", 2 },
                    { 5, "REJECTED", 2, "Mağaza Yardımcısı", new DateTime(2026, 1, 24, 9, 0, 0, 0, DateTimeKind.Utc), "Red sebebi: Fotoğraf eksik", 2 },
                    { 6, "CREATED", 1, "Mağaza Müdürü", new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), "Rapor oluşturuldu", 3 }
                });

            migrationBuilder.InsertData(
                table: "ReportItems",
                columns: new[] { "Id", "CreatedAt", "DamageType", "PhotoUrl", "ProductName", "ProductNo", "Qty", "ReportId" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 21, 10, 0, 0, 0, DateTimeKind.Utc), null, null, "Ürün A", "PRD001", 5, 1 },
                    { 2, new DateTime(2026, 1, 21, 10, 0, 0, 0, DateTimeKind.Utc), null, null, "Ürün B", "PRD002", 3, 1 },
                    { 3, new DateTime(2026, 1, 23, 14, 0, 0, 0, DateTimeKind.Utc), "Kırık", null, "Ürün C", "PRD003", 2, 2 },
                    { 4, new DateTime(2026, 1, 26, 12, 0, 0, 0, DateTimeKind.Utc), null, null, "Ürün D", "PRD004", 10, 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_ReportId",
                table: "EmailLogs",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_MagicLinkTokens_Email",
                table: "MagicLinkTokens",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_MagicLinkTokens_ExpiresAt",
                table: "MagicLinkTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_MagicLinkTokens_Token",
                table: "MagicLinkTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportActions_CreatedAt",
                table: "ReportActions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportActions_ReportId",
                table: "ReportActions",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportItems_ProductNo",
                table: "ReportItems",
                column: "ProductNo");

            migrationBuilder.CreateIndex(
                name: "IX_ReportItems_ReportId",
                table: "ReportItems",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_CreatedById",
                table: "Reports",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReportNo",
                table: "Reports",
                column: "ReportNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ShipmentDate",
                table: "Reports",
                column: "ShipmentDate");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status",
                table: "Reports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_StoreCode",
                table: "Reports",
                column: "StoreCode");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_TplNo",
                table: "Reports",
                column: "TplNo");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_ProviderId",
                table: "Users",
                column: "ProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailLogs");

            migrationBuilder.DropTable(
                name: "MagicLinkTokens");

            migrationBuilder.DropTable(
                name: "ReportActions");

            migrationBuilder.DropTable(
                name: "ReportItems");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
