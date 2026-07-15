using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Sql.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class RoleListService(HealingAssignsDb db, LookupCache lookup)
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
            SortOrder = maxSort + 1,
            SlotCount = 0
        };
        db.RoleLists.Add(roleList);
        await db.SaveChangesAsync();
        return roleList.ToDto([], lookup.PlayerClassName);
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
        return roleList.ToDto(roleList.Slots, lookup.PlayerClassName);
    }

    public async Task<RoleListDto?> UpdateSlotCount(int id, int slotCount)
    {
        var roleList = await db.RoleLists
            .Include(r => r.Slots.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == id);
        if (roleList is null) return null;
        if (slotCount < roleList.Slots.Count) return null;
        roleList.SlotCount = slotCount;
        await db.SaveChangesAsync();
        return roleList.ToDto(roleList.Slots, lookup.PlayerClassName);
    }

    public async Task<bool> Delete(int id)
    {
        var roleList = await db.RoleLists.FindAsync(id);
        if (roleList is null) return false;
        db.RoleLists.Remove(roleList);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<RoleSlotDto?> CreateSlot(int roleListId, int playerId)
    {
        var roleList = await db.RoleLists
            .Include(r => r.Slots)
            .FirstOrDefaultAsync(r => r.Id == roleListId);
        if (roleList is null) return null;
        if (roleList.Slots.Count >= roleList.SlotCount) return null;

        var player = await db.Players
            .Include(p => p.Spec)
            .FirstOrDefaultAsync(p => p.Id == playerId);
        if (player is null) return null;

        var maxSort = roleList.Slots.Count > 0
            ? roleList.Slots.Max(s => s.SortOrder)
            : -1;

        var slot = new RoleSlot
        {
            RoleListId = roleListId,
            PlayerName = player.Name,
            PlayerClassId = player.Spec.PlayerClassId,
            PlayerId = player.Id,
            SortOrder = maxSort + 1
        };

        db.RoleSlots.Add(slot);
        await db.SaveChangesAsync();
        return slot.ToDto(lookup.PlayerClassName);
    }

    public async Task<bool> DeleteSlot(int id)
    {
        var slot = await db.RoleSlots.FindAsync(id);
        if (slot is null) return false;

        var roleListId = slot.RoleListId;
        db.RoleSlots.Remove(slot);
        await db.SaveChangesAsync();

        var remaining = await db.RoleSlots
            .Where(s => s.RoleListId == roleListId)
            .OrderBy(s => s.SortOrder)
            .ToListAsync();

        if (remaining.Count > 0)
        {
            foreach (var s in remaining)
                s.SortOrder = -(s.SortOrder + 1);
            await db.SaveChangesAsync();

            for (var i = 0; i < remaining.Count; i++)
                remaining[i].SortOrder = i;
            await db.SaveChangesAsync();
        }

        return true;
    }

    public async Task ReorderSlots(int roleListId, List<int> slotIds)
    {
        var slots = await db.RoleSlots
            .Where(s => s.RoleListId == roleListId)
            .ToListAsync();

        foreach (var slot in slots)
            slot.SortOrder = -(slot.SortOrder + 1);
        await db.SaveChangesAsync();

        for (var i = 0; i < slotIds.Count; i++)
        {
            var slot = slots.FirstOrDefault(s => s.Id == slotIds[i]);
            if (slot is not null)
                slot.SortOrder = i;
        }
        await db.SaveChangesAsync();
    }
}
