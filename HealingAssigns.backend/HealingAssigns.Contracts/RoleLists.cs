namespace HealingAssigns.Contracts;

public record CreateRoleListRequest(string Name, string? Icon);
public record UpdateRoleListRequest(string Name, string? Icon);
public record CreateSlotRequest(string PlayerName, int? PlayerClassId);
public record ReorderSlotsRequest(List<int> SlotIds);

public record RoleListDto(int Id, string Name, string? Icon, int SortOrder, List<RoleSlotDto> Slots);
public record RoleSlotDto(int Id, string PlayerName, int? PlayerClassId, string? PlayerClassName, int SortOrder);
