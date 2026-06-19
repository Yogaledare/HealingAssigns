namespace HealingAssigns.Contracts;

public record CreateAssignmentRequest(
    string Symbol,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition);

public record UpdateAssignmentRequest(
    string Symbol,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition);

public record AssignmentDto(
    int Id,
    string Symbol,
    string? Description,
    int AssigneeRoleListId,
    int AssigneePosition,
    int? TargetRoleListId,
    int? TargetPosition,
    int SortOrder);
