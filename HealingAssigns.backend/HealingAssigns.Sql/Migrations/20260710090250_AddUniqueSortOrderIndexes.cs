using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueSortOrderIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RoleSlots_RoleListId",
                table: "RoleSlots");

            migrationBuilder.DropIndex(
                name: "IX_RoleLists_SessionId",
                table: "RoleLists");

            migrationBuilder.DropIndex(
                name: "IX_Encounters_SessionId",
                table: "Encounters");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_EncounterId",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_RoleSlots_RoleListId_SortOrder",
                table: "RoleSlots",
                columns: new[] { "RoleListId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoleLists_SessionId_SortOrder",
                table: "RoleLists",
                columns: new[] { "SessionId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_SessionId_SortOrder",
                table: "Encounters",
                columns: new[] { "SessionId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EncounterId_SortOrder",
                table: "Assignments",
                columns: new[] { "EncounterId", "SortOrder" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RoleSlots_RoleListId_SortOrder",
                table: "RoleSlots");

            migrationBuilder.DropIndex(
                name: "IX_RoleLists_SessionId_SortOrder",
                table: "RoleLists");

            migrationBuilder.DropIndex(
                name: "IX_Encounters_SessionId_SortOrder",
                table: "Encounters");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_EncounterId_SortOrder",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_RoleSlots_RoleListId",
                table: "RoleSlots",
                column: "RoleListId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleLists_SessionId",
                table: "RoleLists",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_SessionId",
                table: "Encounters",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EncounterId",
                table: "Assignments",
                column: "EncounterId");
        }
    }
}
