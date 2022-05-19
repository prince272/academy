using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr18 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Course_AspNetUsers_UserId",
                table: "Course");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Course",
                newName: "TeacherId");

            migrationBuilder.RenameIndex(
                name: "IX_Course_UserId",
                table: "Course",
                newName: "IX_Course_TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Course_AspNetUsers_TeacherId",
                table: "Course",
                column: "TeacherId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Course_AspNetUsers_TeacherId",
                table: "Course");

            migrationBuilder.RenameColumn(
                name: "TeacherId",
                table: "Course",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Course_TeacherId",
                table: "Course",
                newName: "IX_Course_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Course_AspNetUsers_UserId",
                table: "Course",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
