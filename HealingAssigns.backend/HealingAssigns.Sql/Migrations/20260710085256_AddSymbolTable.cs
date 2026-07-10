using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddSymbolTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Symbol",
                table: "Assignments");

            migrationBuilder.AddColumn<int>(
                name: "SymbolId",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Symbols",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Symbols", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Symbols",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Skull" },
                    { 2, "Star" },
                    { 3, "Circle" },
                    { 4, "Diamond" },
                    { 5, "Triangle" },
                    { 6, "Square" },
                    { 7, "Moon" },
                    { 8, "Cross" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_SymbolId",
                table: "Assignments",
                column: "SymbolId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Symbols_SymbolId",
                table: "Assignments",
                column: "SymbolId",
                principalTable: "Symbols",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Symbols_SymbolId",
                table: "Assignments");

            migrationBuilder.DropTable(
                name: "Symbols");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_SymbolId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "SymbolId",
                table: "Assignments");

            migrationBuilder.AddColumn<string>(
                name: "Symbol",
                table: "Assignments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
