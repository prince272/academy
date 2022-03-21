using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class Update_Database_6 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Progresses",
                table: "AspNetUsers");

            migrationBuilder.CreateTable(
                name: "CourseProgress",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    SectionId = table.Column<int>(type: "int", nullable: false),
                    LessonId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: true),
                    Completed = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Inputs = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Solve = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseProgress_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseProgress_UserId",
                table: "CourseProgress",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseProgress");

            migrationBuilder.AddColumn<string>(
                name: "Progresses",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true,
                defaultValue: "[]");
        }
    }
}
