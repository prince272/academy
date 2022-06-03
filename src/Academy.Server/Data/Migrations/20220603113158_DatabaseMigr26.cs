using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr26 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IPAddress",
                table: "PostReaction");

            migrationBuilder.RenameColumn(
                name: "UAString",
                table: "PostReaction",
                newName: "AnonymousId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AnonymousId",
                table: "PostReaction",
                newName: "UAString");

            migrationBuilder.AddColumn<string>(
                name: "IPAddress",
                table: "PostReaction",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
