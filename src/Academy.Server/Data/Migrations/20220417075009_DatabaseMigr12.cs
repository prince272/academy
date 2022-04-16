using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr12 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Inputs",
                table: "CourseProgress",
                newName: "Checks");

            migrationBuilder.RenameColumn(
                name: "Inputs",
                table: "Content",
                newName: "Checks");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Checks",
                table: "CourseProgress",
                newName: "Inputs");

            migrationBuilder.RenameColumn(
                name: "Checks",
                table: "Content",
                newName: "Inputs");
        }
    }
}
