using HealingAssigns.Sql.Mapping;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class AssignmentService(HealingAssignsDb db, LookupCache lookup)
{
    public async Task<AssignmentDto?> Create(int encounterId, CreateAssignmentRequest req)
    {
        if (req.ParentAssignmentId is { } parentId)
        {
            // One level deep: the parent must be a top-level row of the same encounter
            var parentOk = await db.Assignments.AnyAsync(a =>
                a.Id == parentId && a.EncounterId == encounterId && a.ParentAssignmentId == null);
            if (!parentOk) return null;
        }

        var maxSort = await db.Assignments
            .Where(a => a.EncounterId == encounterId && a.ParentAssignmentId == req.ParentAssignmentId)
            .MaxAsync(a => (int?)a.SortOrder) ?? -1;

        var assignment = new Assignment
        {
            EncounterId = encounterId,
            ParentAssignmentId = req.ParentAssignmentId,
            SymbolId = req.SymbolId,
            Description = req.Description,
            SlotId = req.SlotId,
            IsEnabled = true,
            SortOrder = maxSort + 1
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();
        return assignment.ToDto(lookup.SymbolName);
    }

    public async Task<AssignmentDto?> Update(int id, UpdateAssignmentRequest req)
    {
        var assignment = await db.Assignments
            .Include(a => a.Children)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assignment is null) return null;

        assignment.SymbolId = req.SymbolId;
        assignment.Description = req.Description;
        assignment.SlotId = req.SlotId;
        assignment.IsEnabled = req.IsEnabled;

        await db.SaveChangesAsync();
        return assignment.ToDto(lookup.SymbolName);
    }

    public async Task<bool> Delete(int id)
    {
        var assignment = await db.Assignments.FindAsync(id);
        if (assignment is null) return false;

        // Self-referential FK is NoAction; remove children first
        await db.Assignments.Where(a => a.ParentAssignmentId == id).ExecuteDeleteAsync();
        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync();
        return true;
    }
}
