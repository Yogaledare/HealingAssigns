namespace HealingAssigns.Contracts;

public record CreateAssignmentRequest(
    int? ParentAssignmentId,
    int? SymbolId,
    string? Description,
    int? SlotId);

public record UpdateAssignmentRequest(
    int? SymbolId,
    string? Description,
    int? SlotId,
    bool IsEnabled);

public record AssignmentDto(
    int Id,
    int? SymbolId,
    string? SymbolName,
    string? Description,
    int? SlotId,
    bool IsEnabled,
    int SortOrder,
    List<AssignmentDto> Children);
