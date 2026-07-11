using HealingAssigns.Contracts;
using HealingAssigns.Sql.Entities;

namespace HealingAssigns.Sql.Mapping;

public static class EntityMappings
{
    public static SessionSummaryDto ToSummaryDto(this Session s) =>
        new(s.Id, s.Name, s.CreatedAt);

    public static SessionDto ToDto(this Session s, List<RoleListDto> roleLists, List<EncounterDto> encounters) =>
        new(s.Id, s.Name, s.CreatedAt, roleLists, encounters);

    public static RoleListDto ToDto(this RoleList r, IEnumerable<RoleSlot> slots,
        Func<int?, string?> playerClassName, Func<int?, string?> roleName) => new(
        r.Id, r.Name, r.RoleId, roleName(r.RoleId), r.SortOrder,
        slots.Select(s => s.ToDto(playerClassName)).ToList()
    );

    public static RoleSlotDto ToDto(this RoleSlot s, Func<int?, string?> playerClassName) =>
        new(s.Id, s.PlayerName, s.PlayerClassId, playerClassName(s.PlayerClassId), s.SortOrder);

    public static EncounterDto ToDto(this Encounter e, IEnumerable<Assignment> assignments, Func<int?, string?> symbolName) => new(
        e.Id, e.Name, e.SortOrder,
        assignments.Select(a => a.ToDto(symbolName)).ToList()
    );

    public static AssignmentDto ToDto(this Assignment a, Func<int?, string?> symbolName) =>
        new(a.Id, a.SymbolId, symbolName(a.SymbolId), a.Description,
            a.AssigneeRoleListId, a.AssigneePosition,
            a.TargetRoleListId, a.TargetPosition, a.SortOrder);
}
