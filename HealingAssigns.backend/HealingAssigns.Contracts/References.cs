namespace HealingAssigns.Contracts;

public record ReferencesDto(
    List<SymbolRefDto> Symbols,
    List<PlayerClassRefDto> PlayerClasses,
    List<RoleRefDto> Roles);

public record SymbolRefDto(int Id, string Name, string Icon);
public record PlayerClassRefDto(int Id, string Name, string Color, string Icon);
public record RoleRefDto(int Id, string Name, string Icon);
