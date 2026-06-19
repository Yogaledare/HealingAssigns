namespace HealingAssigns.Contracts;

public record CreateSessionRequest(string Name);
public record UpdateSessionRequest(string Name);

public record SessionDto(int Id, string Name, DateTime CreatedAt, List<RoleListDto> RoleLists, List<EncounterDto> Encounters);
public record SessionSummaryDto(int Id, string Name, DateTime CreatedAt);
