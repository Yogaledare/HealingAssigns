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
        Func<int?, string?> playerClassName) => new(
        r.Id, r.Name, r.Icon, r.SortOrder,
        slots.Select(s => s.ToDto(playerClassName)).ToList()
    );

    public static RoleSlotDto ToDto(this RoleSlot s, Func<int?, string?> playerClassName)
    {
        var classId = s.Player?.Spec?.PlayerClassId;
        return new(s.Id, s.SortOrder, s.PlayerId, s.Player?.Name, classId, playerClassName(classId));
    }

    public static EncounterDto ToDto(this Encounter e, IEnumerable<Assignment> assignments, Func<int?, string?> symbolName) => new(
        e.Id, e.Name, e.SortOrder,
        assignments.Where(a => a.ParentAssignmentId == null).Select(a => a.ToDto(symbolName)).ToList()
    );

    public static AssignmentDto ToDto(this Assignment a, Func<int?, string?> symbolName) =>
        new(a.Id, a.SymbolId, symbolName(a.SymbolId), a.Description,
            a.SlotId, a.IsEnabled, a.SortOrder,
            a.Children.OrderBy(c => c.SortOrder).Select(c => c.ToDto(symbolName)).ToList());
}
