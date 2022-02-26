using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class Update_Database_2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Attempts",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "ContactInfo",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "Details_CardCvv",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "Details_CardExpiry",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "Details_CardNumber",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "Details_IssuerType",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "Mode",
                table: "Payment");

            migrationBuilder.RenameColumn(
                name: "Details_MobileNumber",
                table: "Payment",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "Details_IssuerName",
                table: "Payment",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "Details_IssuerCode",
                table: "Payment",
                newName: "Email");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Issued",
                table: "Payment",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Issued",
                table: "Payment");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Payment",
                newName: "Details_MobileNumber");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Payment",
                newName: "Details_IssuerName");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Payment",
                newName: "Details_IssuerCode");

            migrationBuilder.AddColumn<int>(
                name: "Attempts",
                table: "Payment",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ContactInfo",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Details_CardCvv",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Details_CardExpiry",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Details_CardNumber",
                table: "Payment",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Details_IssuerType",
                table: "Payment",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mode",
                table: "Payment",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
