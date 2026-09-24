using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using HealingAssigns.Sql.Mapping;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class RoleListService(HealingAssignsDb db, LookupCache lookup)
{
    private IQueryable<RoleList> ListsWithSlots => db.RoleLists
        .Include(r => r.Slots.OrderBy(s => s.SortOrder))
            .ThenInclude(s => s.Player)
                .ThenInclude(p => p!.Spec);

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
        return roleList.ToDto([], lookup.PlayerClassName);
    }

    public async Task<RoleListDto?> Update(int id, string name, string? icon)
    {
        var roleList = await ListsWithSlots.FirstOrDefaultAsync(r => r.Id == id);
        if (roleList is null) return null;
        roleList.Name = name;
        roleList.Icon = icon;
        await db.SaveChangesAsync();
        return roleList.ToDto(roleList.Slots, lookup.PlayerClassName);
    }

    public async Task<bool> Delete(int id)
    {
        var roleList = await db.RoleLists.FindAsync(id);
        if (roleList is null) return false;

        // Slot FK is NoAction; detach assignments from this list's slots first
        var slotIds = db.RoleSlots.Where(s => s.RoleListId == id).Select(s => s.Id);
        await db.Assignments.Where(a => a.SlotId != null && slotIds.Contains(a.SlotId.Value))
            .ExecuteUpdateAsync(u => u.SetProperty(a => a.SlotId, (int?)null));

        db.RoleLists.Remove(roleList);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<RoleSlotDto?> AddSlot(int roleListId)
    {
        var exists = await db.RoleLists.AnyAsync(r => r.Id == roleListId);
        if (!exists) return null;

        var maxSort = await db.RoleSlots
            .Where(s => s.RoleListId == roleListId)
            .MaxAsync(s => (int?)s.SortOrder) ?? -1;

        var slot = new RoleSlot { RoleListId = roleListId, SortOrder = maxSort + 1 };
        db.RoleSlots.Add(slot);
        await db.SaveChangesAsync();
        return slot.ToDto(lookup.PlayerClassName);
    }

    public async Task<RoleSlotDto?> SetSlotPlayer(int slotId, int? playerId)
    {
        var slot = await db.RoleSlots
            .Include(s => s.Player).ThenInclude(p => p!.Spec)
            .FirstOrDefaultAsync(s => s.Id == slotId);
        if (slot is null) return null;

        if (playerId is null)
        {
            slot.PlayerId = null;
            slot.Player = null;
        }
        else
        {
            var player = await db.Players
                .Include(p => p.Spec)
                .FirstOrDefaultAsync(p => p.Id == playerId.Value);
            if (player is null) return null;
            slot.PlayerId = player.Id;
            slot.Player = player;
        }

        await db.SaveChangesAsync();
        return slot.ToDto(lookup.PlayerClassName);
    }

    public async Task<bool> DeleteSlot(int id)
    {
        var slot = await db.RoleSlots.FindAsync(id);
        if (slot is null) return false;

        // Slot FK is NoAction; detach assignments from this slot first
        await db.Assignments.Where(a => a.SlotId == id)
            .ExecuteUpdateAsync(u => u.SetProperty(a => a.SlotId, (int?)null));

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
