using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddAssigneeTarget : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleLists_RoleListId",
                table: "Assignments");

            migrationBuilder.RenameColumn(
                name: "RoleListId",
                table: "Assignments",
                newName: "AssigneeRoleListId");

            migrationBuilder.RenameColumn(
                name: "Position",
                table: "Assignments",
                newName: "AssigneePosition");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_RoleListId",
                table: "Assignments",
                newName: "IX_Assignments_AssigneeRoleListId");

            migrationBuilder.AddColumn<int>(
                name: "TargetPosition",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetRoleListId",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_TargetRoleListId",
                table: "Assignments",
                column: "TargetRoleListId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_RoleLists_AssigneeRoleListId",
                table: "Assignments",
                column: "AssigneeRoleListId",
                principalTable: "RoleLists",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_RoleLists_TargetRoleListId",
                table: "Assignments",
                column: "TargetRoleListId",
                principalTable: "RoleLists",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleLists_AssigneeRoleListId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleLists_TargetRoleListId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_TargetRoleListId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "TargetPosition",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "TargetRoleListId",
                table: "Assignments");

            migrationBuilder.RenameColumn(
                name: "AssigneeRoleListId",
                table: "Assignments",
                newName: "RoleListId");

            migrationBuilder.RenameColumn(
                name: "AssigneePosition",
                table: "Assignments",
                newName: "Position");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_AssigneeRoleListId",
                table: "Assignments",
                newName: "IX_Assignments_RoleListId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_RoleLists_RoleListId",
                table: "Assignments",
                column: "RoleListId",
                principalTable: "RoleLists",
                principalColumn: "Id");
        }
    }
}
