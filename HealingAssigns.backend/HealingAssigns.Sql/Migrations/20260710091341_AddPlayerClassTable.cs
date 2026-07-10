using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerClassTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClassColor",
                table: "RoleSlots");

            migrationBuilder.DropColumn(
                name: "ClassName",
                table: "RoleSlots");

            migrationBuilder.AddColumn<int>(
                name: "PlayerClassId",
                table: "RoleSlots",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PlayerClasses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerClasses", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PlayerClasses",
                columns: new[] { "Id", "Color", "Name" },
                values: new object[,]
                {
                    { 1, "#C69B6D", "Warrior" },
                    { 2, "#FFFFFF", "Priest" },
                    { 3, "#3FC7EB", "Mage" },
                    { 4, "#FF7C0A", "Druid" },
                    { 5, "#AAD372", "Hunter" },
                    { 6, "#FFF468", "Rogue" },
                    { 7, "#0070DD", "Shaman" },
                    { 8, "#F48CBA", "Paladin" },
                    { 9, "#8788EE", "Warlock" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleSlots_PlayerClassId",
                table: "RoleSlots",
                column: "PlayerClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleSlots_PlayerClasses_PlayerClassId",
                table: "RoleSlots",
                column: "PlayerClassId",
                principalTable: "PlayerClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoleSlots_PlayerClasses_PlayerClassId",
                table: "RoleSlots");

            migrationBuilder.DropTable(
                name: "PlayerClasses");

            migrationBuilder.DropIndex(
                name: "IX_RoleSlots_PlayerClassId",
                table: "RoleSlots");

            migrationBuilder.DropColumn(
                name: "PlayerClassId",
                table: "RoleSlots");

            migrationBuilder.AddColumn<string>(
                name: "ClassColor",
                table: "RoleSlots",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClassName",
                table: "RoleSlots",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
