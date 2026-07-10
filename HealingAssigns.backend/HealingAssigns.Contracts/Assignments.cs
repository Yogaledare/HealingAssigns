namespace HealingAssigns.Contracts;

public record CreateAssignmentRequest(
    int? SymbolId,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition);

public record UpdateAssignmentRequest(
    int? SymbolId,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition);

public record AssignmentDto(
    int Id,
    int? SymbolId,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition,
    int SortOrder);
