using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Sql.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class SessionService(HealingAssignsDb db, LookupCache lookup)
{
    public async Task<List<SessionSummaryDto>> GetAll()
    {
        return await db.Sessions
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => s.ToSummaryDto())
            .ToListAsync();
    }

    public async Task<SessionDto?> Get(int id)
    {
        var session = await db.Sessions
            .Include(s => s.RoleLists.OrderBy(r => r.SortOrder))
                .ThenInclude(r => r.Slots.OrderBy(s => s.SortOrder))
            .Include(s => s.Encounters.OrderBy(e => e.SortOrder))
                .ThenInclude(e => e.Assignments.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session is null) return null;

        return session.ToDto(
            session.RoleLists.Select(r => r.ToDto(r.Slots, lookup.PlayerClassName, lookup.RoleName)).ToList(),
            session.Encounters.Select(e => e.ToDto(e.Assignments, lookup.SymbolName)).ToList()
        );
    }

    public async Task<SessionSummaryDto> Create(string name)
    {
        var session = new Session { Name = name };
        db.Sessions.Add(session);
        await db.SaveChangesAsync();
        return session.ToSummaryDto();
    }

    public async Task<SessionSummaryDto?> Update(int id, string name)
    {
        var session = await db.Sessions.FindAsync(id);
        if (session is null) return null;
        session.Name = name;
        await db.SaveChangesAsync();
        return session.ToSummaryDto();
    }
}
