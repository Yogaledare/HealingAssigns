using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class DropRoleTableRestoreIcon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoleLists_Roles_RoleId",
                table: "RoleLists");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_RoleLists_RoleId",
                table: "RoleLists");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "RoleLists");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "RoleLists",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icon",
                table: "RoleLists");

            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "RoleLists",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Icon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Icon", "Name" },
                values: new object[,]
                {
                    { 1, "🩹", "Healer" },
                    { 2, "🛡️", "Tank" },
                    { 3, "⚔️", "DPS" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleLists_RoleId",
                table: "RoleLists",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleLists_Roles_RoleId",
                table: "RoleLists",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
