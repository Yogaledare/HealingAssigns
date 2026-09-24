using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealingAssigns.Sql.Migrations
{
    /// <inheritdoc />
    public partial class PositionalSlotsAndAssignmentTree : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // --- 1. New columns (old columns still in place) ---

            migrationBuilder.AddColumn<bool>(
                name: "IsEnabled",
                table: "Assignments",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentAssignmentId",
                table: "Assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SlotId",
                table: "Assignments",
                type: "int",
                nullable: true);

            // Old uniqueness spanned all rows per encounter; child rows number per
            // parent, so this must go before the backfill inserts children.
            migrationBuilder.DropIndex(
                name: "IX_Assignments_EncounterId_SortOrder",
                table: "Assignments");

            // --- 2. Materialize open slots from SlotCount (trailing positions) ---

            migrationBuilder.Sql(@"
;WITH n AS (
    SELECT 1 AS i
    UNION ALL
    SELECT i + 1 FROM n WHERE i < 100
)
INSERT INTO RoleSlots (RoleListId, SortOrder, PlayerName, PlayerClassId, PlayerId)
SELECT rl.Id, f.filled + n.i - 1, N'', NULL, NULL
FROM RoleLists rl
CROSS APPLY (SELECT COUNT(*) AS filled FROM RoleSlots s WHERE s.RoleListId = rl.Id) f
JOIN n ON n.i <= rl.SlotCount - f.filled
OPTION (MAXRECURSION 100);
");

            // --- 2b. Slots from before the Players table exist as name-only rows
            //         (PlayerId NULL, PlayerName set). Link them by name where a
            //         matching player exists; unmatched names become open slots. ---

            migrationBuilder.Sql(@"
UPDATE s SET PlayerId = p.Id
FROM RoleSlots s
JOIN Players p ON p.Name = s.PlayerName
WHERE s.PlayerId IS NULL AND s.PlayerName <> N'';
");

            // --- 3. Reshape assignments into the job tree.
            //        Old row with a target: the row becomes the target's job and its
            //        assignee becomes a child row. Old row without a target: the row
            //        keeps its assignee slot directly.
            //        Positions were 1-based indexes over filled slots, which hold
            //        SortOrder 0..n-1; open slots created above sort after them. ---

            migrationBuilder.Sql(@"
UPDATE a SET SlotId = s.Id
FROM Assignments a
JOIN RoleSlots s ON s.RoleListId = a.TargetRoleListId AND s.SortOrder = a.TargetPosition - 1
WHERE a.TargetRoleListId IS NOT NULL AND a.TargetPosition IS NOT NULL;
");

            migrationBuilder.Sql(@"
UPDATE a SET SlotId = s.Id
FROM Assignments a
JOIN RoleSlots s ON s.RoleListId = a.AssigneeRoleListId AND s.SortOrder = a.AssigneePosition - 1
WHERE a.TargetRoleListId IS NULL OR a.TargetPosition IS NULL;
");

            // Children inherit the encounter; legacy NOT NULL assignee columns get
            // placeholder copies since they are dropped right below.
            migrationBuilder.Sql(@"
INSERT INTO Assignments (EncounterId, ParentAssignmentId, SymbolId, Description, SlotId, IsEnabled, SortOrder, AssigneeRoleListId, AssigneePosition)
SELECT a.EncounterId, a.Id, NULL, NULL, s.Id, 1, 0, a.AssigneeRoleListId, a.AssigneePosition
FROM Assignments a
JOIN RoleSlots s ON s.RoleListId = a.AssigneeRoleListId AND s.SortOrder = a.AssigneePosition - 1
WHERE a.TargetRoleListId IS NOT NULL AND a.TargetPosition IS NOT NULL;
");

            // --- 4. Drop the legacy schema ---

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleLists_AssigneeRoleListId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleLists_TargetRoleListId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_RoleSlots_PlayerClasses_PlayerClassId",
                table: "RoleSlots");

            migrationBuilder.DropIndex(
                name: "IX_RoleSlots_PlayerClassId",
                table: "RoleSlots");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_AssigneeRoleListId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_TargetRoleListId",
                table: "Assignments");

            migrationBuilder.DropColumn(name: "PlayerClassId", table: "RoleSlots");
            migrationBuilder.DropColumn(name: "PlayerName", table: "RoleSlots");
            migrationBuilder.DropColumn(name: "SlotCount", table: "RoleLists");
            migrationBuilder.DropColumn(name: "AssigneePosition", table: "Assignments");
            migrationBuilder.DropColumn(name: "AssigneeRoleListId", table: "Assignments");
            migrationBuilder.DropColumn(name: "TargetPosition", table: "Assignments");
            migrationBuilder.DropColumn(name: "TargetRoleListId", table: "Assignments");

            // --- 5. New indexes and foreign keys ---

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_SlotId",
                table: "Assignments",
                column: "SlotId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EncounterId_ParentAssignmentId_SortOrder",
                table: "Assignments",
                columns: new[] { "EncounterId", "ParentAssignmentId", "SortOrder" },
                unique: true,
                filter: "[ParentAssignmentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_ParentAssignmentId",
                table: "Assignments",
                column: "ParentAssignmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Assignments_ParentAssignmentId",
                table: "Assignments",
                column: "ParentAssignmentId",
                principalTable: "Assignments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_RoleSlots_SlotId",
                table: "Assignments",
                column: "SlotId",
                principalTable: "RoleSlots",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort reversal for dev round-trips: restores the positional-int model.
            // Lossy by design — extra children beyond the first are dropped, and rows
            // the old model cannot hold (text-only, no assignee) are deleted.

            migrationBuilder.AddColumn<int>(
                name: "AssigneePosition",
                table: "Assignments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AssigneeRoleListId",
                table: "Assignments",
                type: "int",
                nullable: false,
                defaultValue: 0);

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

            migrationBuilder.AddColumn<int>(
                name: "PlayerClassId",
                table: "RoleSlots",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerName",
                table: "RoleSlots",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SlotCount",
                table: "RoleLists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
;WITH ranked AS (
    SELECT Id, RoleListId, ROW_NUMBER() OVER (PARTITION BY RoleListId ORDER BY SortOrder) AS pos
    FROM RoleSlots WHERE PlayerId IS NOT NULL
)
UPDATE a SET AssigneeRoleListId = r.RoleListId, AssigneePosition = r.pos
FROM Assignments a
JOIN Assignments c ON c.ParentAssignmentId = a.Id
    AND c.SortOrder = (SELECT MIN(c2.SortOrder) FROM Assignments c2 WHERE c2.ParentAssignmentId = a.Id)
JOIN ranked r ON r.Id = c.SlotId;
");

            migrationBuilder.Sql(@"
;WITH ranked AS (
    SELECT Id, RoleListId, ROW_NUMBER() OVER (PARTITION BY RoleListId ORDER BY SortOrder) AS pos
    FROM RoleSlots WHERE PlayerId IS NOT NULL
)
UPDATE a SET TargetRoleListId = r.RoleListId, TargetPosition = r.pos
FROM Assignments a
JOIN ranked r ON r.Id = a.SlotId
WHERE EXISTS (SELECT 1 FROM Assignments c WHERE c.ParentAssignmentId = a.Id);
");

            migrationBuilder.Sql(@"
;WITH ranked AS (
    SELECT Id, RoleListId, ROW_NUMBER() OVER (PARTITION BY RoleListId ORDER BY SortOrder) AS pos
    FROM RoleSlots WHERE PlayerId IS NOT NULL
)
UPDATE a SET AssigneeRoleListId = r.RoleListId, AssigneePosition = r.pos
FROM Assignments a
JOIN ranked r ON r.Id = a.SlotId
WHERE a.ParentAssignmentId IS NULL
  AND NOT EXISTS (SELECT 1 FROM Assignments c WHERE c.ParentAssignmentId = a.Id);
");

            migrationBuilder.Sql(@"
DELETE FROM Assignments WHERE ParentAssignmentId IS NOT NULL;
DELETE FROM Assignments WHERE AssigneeRoleListId = 0;
");

            migrationBuilder.Sql(@"
UPDATE rl SET SlotCount = (SELECT COUNT(*) FROM RoleSlots s WHERE s.RoleListId = rl.Id)
FROM RoleLists rl;
");

            migrationBuilder.Sql(@"
UPDATE s SET PlayerName = p.Name, PlayerClassId = sp.PlayerClassId
FROM RoleSlots s
JOIN Players p ON p.Id = s.PlayerId
JOIN Specs sp ON sp.Id = p.SpecId;
");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Assignments_ParentAssignmentId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_RoleSlots_SlotId",
                table: "Assignments");

            migrationBuilder.Sql(@"
DELETE FROM RoleSlots WHERE PlayerId IS NULL;
");

            migrationBuilder.Sql(@"
UPDATE s SET SortOrder = -(x.rn) - 1
FROM RoleSlots s
JOIN (SELECT Id, ROW_NUMBER() OVER (PARTITION BY RoleListId ORDER BY SortOrder) AS rn FROM RoleSlots) x ON x.Id = s.Id;
UPDATE RoleSlots SET SortOrder = -SortOrder - 2;
");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_SlotId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_EncounterId_ParentAssignmentId_SortOrder",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_ParentAssignmentId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "ParentAssignmentId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "SlotId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "IsEnabled",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_RoleSlots_PlayerClassId",
                table: "RoleSlots",
                column: "PlayerClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_AssigneeRoleListId",
                table: "Assignments",
                column: "AssigneeRoleListId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_TargetRoleListId",
                table: "Assignments",
                column: "TargetRoleListId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_EncounterId_SortOrder",
                table: "Assignments",
                columns: new[] { "EncounterId", "SortOrder" },
                unique: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_RoleSlots_PlayerClasses_PlayerClassId",
                table: "RoleSlots",
                column: "PlayerClassId",
                principalTable: "PlayerClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
