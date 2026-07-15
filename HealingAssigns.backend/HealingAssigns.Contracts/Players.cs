namespace HealingAssigns.Contracts;

public record CreatePlayerRequest(string Name, int SpecId);
public record UpdatePlayerRequest(string Name, int SpecId);
public record ImportPlayersRequest(string Text);

public record PlayerDto(
    int Id, string Name,
    int SpecId, string SpecName,
    int PlayerClassId, string PlayerClassName, string PlayerClassColor,
    int RoleId, string RoleName,
    bool IsActive, DateTime? LastActivatedAt);

public record ImportedPlayerDto(
    string Name, string? SpecName, string? ClassName,
    string Status, string SignupStatus);

public record ImportPlayersResponse(List<ImportedPlayerDto> Players);
