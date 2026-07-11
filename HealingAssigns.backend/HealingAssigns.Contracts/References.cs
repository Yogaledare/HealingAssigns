namespace HealingAssigns.Contracts;

public record ReferencesDto(
    List<SymbolRefDto> Symbols,
    List<PlayerClassRefDto> PlayerClasses,
    List<RoleRefDto> Roles);

public record SymbolRefDto(int Id, string Name);
public record PlayerClassRefDto(int Id, string Name, string Color);
public record RoleRefDto(int Id, string Name, string Icon);
