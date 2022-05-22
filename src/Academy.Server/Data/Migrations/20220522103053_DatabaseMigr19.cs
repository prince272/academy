using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr19 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "State",
                table: "Course");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Post",
                newName: "Body");

            migrationBuilder.AddColumn<long>(
                name: "Duration",
                table: "Post",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Post");

            migrationBuilder.RenameColumn(
                name: "Body",
                table: "Post",
                newName: "Description");

            migrationBuilder.AddColumn<int>(
                name: "State",
                table: "Course",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
