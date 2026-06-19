namespace HealingAssigns.Contracts;

public record CreateEncounterRequest(string Name);
public record UpdateEncounterRequest(string Name);

public record EncounterDto(int Id, string Name, int SortOrder, List<AssignmentDto> Assignments);
