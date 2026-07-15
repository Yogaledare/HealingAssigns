using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerActiveStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Players",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivatedAt",
                table: "Players",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "LastActivatedAt",
                table: "Players");
        }
    }
}
