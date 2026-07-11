using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddIconsToSymbolsAndPlayerClasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Symbols",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "PlayerClasses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 1,
                column: "Icon",
                value: "⚔️");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 2,
                column: "Icon",
                value: "🙏");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 3,
                column: "Icon",
                value: "🔮");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 4,
                column: "Icon",
                value: "🌿");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 5,
                column: "Icon",
                value: "🏹");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 6,
                column: "Icon",
                value: "🗡️");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 7,
                column: "Icon",
                value: "⚡");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 8,
                column: "Icon",
                value: "⚜️");

            migrationBuilder.UpdateData(
                table: "PlayerClasses",
                keyColumn: "Id",
                keyValue: 9,
                column: "Icon",
                value: "😈");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 1,
                column: "Icon",
                value: "💀");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 2,
                column: "Icon",
                value: "⭐");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 3,
                column: "Icon",
                value: "🟠");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 4,
                column: "Icon",
                value: "🔶");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 5,
                column: "Icon",
                value: "🔺");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 6,
                column: "Icon",
                value: "🟦");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 7,
                column: "Icon",
                value: "🌙");

            migrationBuilder.UpdateData(
                table: "Symbols",
                keyColumn: "Id",
                keyValue: 8,
                column: "Icon",
                value: "❌");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Symbols");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "PlayerClasses");
        }
    }
}
