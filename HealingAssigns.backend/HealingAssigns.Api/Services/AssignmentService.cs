using HealingAssigns.Sql.Mapping;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class AssignmentService(HealingAssignsDb db)
{
    public async Task<AssignmentDto> Create(int encounterId, int? symbolId, string? description,
        int assigneeRoleListId, int assigneePosition, int? targetRoleListId, int? targetPosition)
    {
        var maxSort = await db.Assignments
            .Where(a => a.EncounterId == encounterId)
            .MaxAsync(a => (int?)a.SortOrder) ?? -1;

        var assignment = new Assignment
        {
            EncounterId = encounterId,
            SymbolId = symbolId,
            Description = description,
            AssigneeRoleListId = assigneeRoleListId,
            AssigneePosition = assigneePosition,
            TargetRoleListId = targetRoleListId,
            TargetPosition = targetPosition,
            SortOrder = maxSort + 1
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();
        return assignment.ToDto();
    }

    public async Task<AssignmentDto?> Update(int id, int? symbolId, string? description,
        int assigneeRoleListId, int assigneePosition, int? targetRoleListId, int? targetPosition)
    {
        var assignment = await db.Assignments.FindAsync(id);
        if (assignment is null) return null;
        assignment.SymbolId = symbolId;
        assignment.Description = description;
        assignment.AssigneeRoleListId = assigneeRoleListId;
        assignment.AssigneePosition = assigneePosition;
        assignment.TargetRoleListId = targetRoleListId;
        assignment.TargetPosition = targetPosition;
        await db.SaveChangesAsync();
        return assignment.ToDto();
    }

    public async Task<bool> Delete(int id)
    {
        var assignment = await db.Assignments.FindAsync(id);
        if (assignment is null) return false;
        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync();
        return true;
    }
}
