using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddSlotCountToRoleList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SlotCount",
                table: "RoleLists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                "UPDATE rl SET rl.SlotCount = (SELECT COUNT(*) FROM RoleSlots rs WHERE rs.RoleListId = rl.Id) FROM RoleLists rl");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SlotCount",
                table: "RoleLists");
        }
    }
}
