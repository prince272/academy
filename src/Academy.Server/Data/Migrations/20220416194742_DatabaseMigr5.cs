using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr5 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Media");

            migrationBuilder.DropColumn(
                name: "Document",
                table: "Lesson");

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Lesson");

            migrationBuilder.DropColumn(
                name: "ExternalMediaUrl",
                table: "Lesson");

            migrationBuilder.DropColumn(
                name: "Media",
                table: "Lesson");

            migrationBuilder.AddColumn<string>(
                name: "Document",
                table: "Question",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalMediaUrl",
                table: "Question",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Media",
                table: "Question",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Question",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Document",
                table: "Question");

            migrationBuilder.DropColumn(
                name: "ExternalMediaUrl",
                table: "Question");

            migrationBuilder.DropColumn(
                name: "Media",
                table: "Question");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Question");

            migrationBuilder.AddColumn<long>(
                name: "Duration",
                table: "Media",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Document",
                table: "Lesson",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "Duration",
                table: "Lesson",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "ExternalMediaUrl",
                table: "Lesson",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Media",
                table: "Lesson",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
