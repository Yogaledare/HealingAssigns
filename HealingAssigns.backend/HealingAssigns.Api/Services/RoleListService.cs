using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Sql.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class RoleListService(HealingAssignsDb db)
{
    public async Task<RoleListDto> Create(int sessionId, string name, string? icon)
    {
        var maxSort = await db.RoleLists
            .Where(r => r.SessionId == sessionId)
            .MaxAsync(r => (int?)r.SortOrder) ?? -1;

        var roleList = new RoleList
        {
            SessionId = sessionId,
            Name = name,
            Icon = icon,
            SortOrder = maxSort + 1
        };
        db.RoleLists.Add(roleList);
        await db.SaveChangesAsync();
        return roleList.ToDto([]);
    }

    public async Task<RoleListDto?> Update(int id, string name, string? icon)
    {
        var roleList = await db.RoleLists
            .Include(r => r.Slots.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == id);
        if (roleList is null) return null;
        roleList.Name = name;
        roleList.Icon = icon;
        await db.SaveChangesAsync();
        return roleList.ToDto(roleList.Slots);
    }

    public async Task<bool> Delete(int id)
    {
        var roleList = await db.RoleLists.FindAsync(id);
        if (roleList is null) return false;
        db.RoleLists.Remove(roleList);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<RoleSlotDto> CreateSlot(int roleListId, string playerName, int? playerClassId)
    {
        var maxSort = await db.RoleSlots
            .Where(s => s.RoleListId == roleListId)
            .MaxAsync(s => (int?)s.SortOrder) ?? -1;

        var slot = new RoleSlot
        {
            RoleListId = roleListId,
            PlayerName = playerName,
            PlayerClassId = playerClassId,
            SortOrder = maxSort + 1
        };
        db.RoleSlots.Add(slot);
        await db.SaveChangesAsync();
        return slot.ToDto();
    }

    public async Task<bool> DeleteSlot(int id)
    {
        var slot = await db.RoleSlots.FindAsync(id);
        if (slot is null) return false;
        db.RoleSlots.Remove(slot);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task ReorderSlots(int roleListId, List<int> slotIds)
    {
        var slots = await db.RoleSlots
            .Where(s => s.RoleListId == roleListId)
            .ToListAsync();

        for (var i = 0; i < slotIds.Count; i++)
        {
            var slot = slots.FirstOrDefault(s => s.Id == slotIds[i]);
            if (slot is not null)
                slot.SortOrder = i;
        }
        await db.SaveChangesAsync();
    }
}
