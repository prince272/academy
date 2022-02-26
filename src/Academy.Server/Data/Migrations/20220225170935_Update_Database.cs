using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class Update_Database : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Reason",
                table: "Payment",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReasonId",
                table: "Payment",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reason",
                table: "Payment");

            migrationBuilder.DropColumn(
                name: "ReasonId",
                table: "Payment");
        }
    }
}
