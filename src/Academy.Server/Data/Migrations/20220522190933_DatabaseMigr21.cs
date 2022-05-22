using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr21 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseProgress_AspNetUsers_UserId",
                table: "CourseProgress");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseProgress_Course_CourseId",
                table: "CourseProgress");

            migrationBuilder.DropForeignKey(
                name: "FK_Post_AspNetUsers_UserId",
                table: "Post");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Post",
                newName: "TeacherId");

            migrationBuilder.RenameColumn(
                name: "Body",
                table: "Post",
                newName: "Summary");

            migrationBuilder.RenameIndex(
                name: "IX_Post_UserId",
                table: "Post",
                newName: "IX_Post_TeacherId");

            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Post",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Post",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Post",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseProgress_AspNetUsers_UserId",
                table: "CourseProgress",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseProgress_Course_CourseId",
                table: "CourseProgress",
                column: "CourseId",
                principalTable: "Course",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Post_AspNetUsers_TeacherId",
                table: "Post",
                column: "TeacherId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseProgress_AspNetUsers_UserId",
                table: "CourseProgress");

            migrationBuilder.DropForeignKey(
                name: "FK_CourseProgress_Course_CourseId",
                table: "CourseProgress");

            migrationBuilder.DropForeignKey(
                name: "FK_Post_AspNetUsers_TeacherId",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Post");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Post");

            migrationBuilder.RenameColumn(
                name: "TeacherId",
                table: "Post",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "Summary",
                table: "Post",
                newName: "Body");

            migrationBuilder.RenameIndex(
                name: "IX_Post_TeacherId",
                table: "Post",
                newName: "IX_Post_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseProgress_AspNetUsers_UserId",
                table: "CourseProgress",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourseProgress_Course_CourseId",
                table: "CourseProgress",
                column: "CourseId",
                principalTable: "Course",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Post_AspNetUsers_UserId",
                table: "Post",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
