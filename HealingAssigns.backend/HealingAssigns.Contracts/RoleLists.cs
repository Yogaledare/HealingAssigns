namespace HealingAssigns.Contracts;

public record CreateRoleListRequest(string Name, string? Icon);
public record UpdateRoleListRequest(string Name, string? Icon);
public record CreateSlotRequest(string PlayerName, string? ClassName, string? ClassColor);
public record ReorderSlotsRequest(List<int> SlotIds);

public record RoleListDto(int Id, string Name, string? Icon, int SortOrder, List<RoleSlotDto> Slots);
public record RoleSlotDto(int Id, string PlayerName, string? ClassName, string? ClassColor, int SortOrder);
