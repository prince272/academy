using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Server.Data.Migrations
{
    public partial class DatabaseMigr2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lesson_Media_DocumentId",
                table: "Lesson");

            migrationBuilder.DropIndex(
                name: "IX_Lesson_DocumentId",
                table: "Lesson");

            migrationBuilder.DropColumn(
                name: "DocumentId",
                table: "Lesson");

            migrationBuilder.AddColumn<string>(
                name: "Document",
                table: "Lesson",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Document",
                table: "Lesson");

            migrationBuilder.AddColumn<int>(
                name: "DocumentId",
                table: "Lesson",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lesson_DocumentId",
                table: "Lesson",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lesson_Media_DocumentId",
                table: "Lesson",
                column: "DocumentId",
                principalTable: "Media",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
