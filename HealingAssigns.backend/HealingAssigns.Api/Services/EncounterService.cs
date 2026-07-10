using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Sql.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class EncounterService(HealingAssignsDb db, LookupCache lookup)
{
    public async Task<EncounterDto> Create(int sessionId, string name)
    {
        var maxSort = await db.Encounters
            .Where(e => e.SessionId == sessionId)
            .MaxAsync(e => (int?)e.SortOrder) ?? -1;

        var encounter = new Encounter
        {
            SessionId = sessionId,
            Name = name,
            SortOrder = maxSort + 1
        };
        db.Encounters.Add(encounter);
        await db.SaveChangesAsync();
        return encounter.ToDto([], lookup.SymbolName);
    }

    public async Task<EncounterDto?> Update(int id, string name)
    {
        var encounter = await db.Encounters
            .Include(e => e.Assignments.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(e => e.Id == id);
        if (encounter is null) return null;
        encounter.Name = name;
        await db.SaveChangesAsync();
        return encounter.ToDto(encounter.Assignments, lookup.SymbolName);
    }

    public async Task<bool> Delete(int id)
    {
        var encounter = await db.Encounters.FindAsync(id);
        if (encounter is null) return false;
        db.Encounters.Remove(encounter);
        await db.SaveChangesAsync();
        return true;
    }
}
