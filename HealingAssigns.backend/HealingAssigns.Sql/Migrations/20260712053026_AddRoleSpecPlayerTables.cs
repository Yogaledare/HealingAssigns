using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleSpecPlayerTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlayerId",
                table: "RoleSlots",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Specs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RaidHelperKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PlayerClassId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Specs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Specs_PlayerClasses_PlayerClassId",
                        column: x => x.PlayerClassId,
                        principalTable: "PlayerClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Specs_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SpecId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Players_Specs_SpecId",
                        column: x => x.SpecId,
                        principalTable: "Specs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Healer" },
                    { 2, "Tank" },
                    { 3, "Dps" }
                });

            migrationBuilder.InsertData(
                table: "Specs",
                columns: new[] { "Id", "Name", "PlayerClassId", "RaidHelperKey", "RoleId" },
                values: new object[,]
                {
                    { 1, "Arms", 1, "Arms", 3 },
                    { 2, "Fury", 1, "Fury", 3 },
                    { 3, "Protection", 1, "Protection", 2 },
                    { 4, "Discipline", 2, "Discipline", 1 },
                    { 5, "Holy", 2, "Holy", 1 },
                    { 6, "Shadow", 2, "Shadow", 3 },
                    { 7, "Arcane", 3, "Arcane", 3 },
                    { 8, "Fire", 3, "Fire", 3 },
                    { 9, "Frost", 3, "Frost", 3 },
                    { 10, "Balance", 4, "Balance", 3 },
                    { 11, "Feral", 4, "Feral", 3 },
                    { 12, "Guardian", 4, "Guardian", 2 },
                    { 13, "Restoration", 4, "Restoration", 1 },
                    { 14, "Dreamstate", 4, "Dreamstate", 1 },
                    { 15, "Beast Mastery", 5, "Beastmastery", 3 },
                    { 16, "Marksmanship", 5, "Marksmanship", 3 },
                    { 17, "Survival", 5, "Survival", 3 },
                    { 18, "Assassination", 6, "Assassination", 3 },
                    { 19, "Combat", 6, "Combat", 3 },
                    { 20, "Subtlety", 6, "Subtlety", 3 },
                    { 21, "Elemental", 7, "Elemental", 3 },
                    { 22, "Enhancement", 7, "Enhancement", 3 },
                    { 23, "Restoration", 7, "Restoration1", 1 },
                    { 24, "Holy", 8, "Holy1", 1 },
                    { 25, "Protection", 8, "Protection1", 2 },
                    { 26, "Retribution", 8, "Retribution", 3 },
                    { 27, "Affliction", 9, "Affliction", 3 },
                    { 28, "Demonology", 9, "Demonology", 3 },
                    { 29, "Destruction", 9, "Destruction", 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleSlots_PlayerId",
                table: "RoleSlots",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_Name",
                table: "Players",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_SpecId",
                table: "Players",
                column: "SpecId");

            migrationBuilder.CreateIndex(
                name: "IX_Specs_PlayerClassId",
                table: "Specs",
                column: "PlayerClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Specs_RaidHelperKey",
                table: "Specs",
                column: "RaidHelperKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Specs_RoleId",
                table: "Specs",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleSlots_Players_PlayerId",
                table: "RoleSlots",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoleSlots_Players_PlayerId",
                table: "RoleSlots");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "Specs");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_RoleSlots_PlayerId",
                table: "RoleSlots");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "RoleSlots");
        }
    }
}
