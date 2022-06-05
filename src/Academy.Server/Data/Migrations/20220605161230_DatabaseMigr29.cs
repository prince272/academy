using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr29 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalUrl",
                table: "Payment");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Processing",
                table: "Payment",
                type: "datetimeoffset",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Processing",
                table: "Payment");

            migrationBuilder.AddColumn<string>(
                name: "ExternalUrl",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
