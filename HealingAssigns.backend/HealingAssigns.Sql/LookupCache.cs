using HealingAssigns.Contracts;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Sql;

public class LookupCache
{
    private Dictionary<int, string> _symbols = new();
    private Dictionary<int, string> _playerClasses = new();
    private Dictionary<string, int> _specKeyToId = new(StringComparer.OrdinalIgnoreCase);

    private ReferencesDto _references = new([], [], [], []);

    public async Task Load(HealingAssignsDb db)
    {
        var symbols = await db.Symbols.ToListAsync();
        var playerClasses = await db.PlayerClasses.ToListAsync();
        var roles = await db.Roles.ToListAsync();
        var specs = await db.Specs.ToListAsync();

        _symbols = symbols.ToDictionary(s => s.Id, s => s.Name);
        _playerClasses = playerClasses.ToDictionary(c => c.Id, c => c.Name);
        _specKeyToId = specs.ToDictionary(s => s.RaidHelperKey, s => s.Id, StringComparer.OrdinalIgnoreCase);

        _references = new ReferencesDto(
            symbols.Select(s => new SymbolRefDto(s.Id, s.Name, s.Icon)).ToList(),
            playerClasses.Select(c => new PlayerClassRefDto(c.Id, c.Name, c.Color, c.Icon)).ToList(),
            roles.Select(r => new RoleRefDto(r.Id, r.Name)).ToList(),
            specs.Select(s => new SpecRefDto(s.Id, s.Name, s.PlayerClassId, s.RoleId, s.RaidHelperKey)).ToList()
        );
    }

    public ReferencesDto References => _references;

    public string? SymbolName(int? id) =>
        id.HasValue && _symbols.TryGetValue(id.Value, out var name) ? name : null;

    public string? PlayerClassName(int? id) =>
        id.HasValue && _playerClasses.TryGetValue(id.Value, out var name) ? name : null;

    public int? SpecIdByRaidHelperKey(string key) =>
        _specKeyToId.TryGetValue(key, out var id) ? id : null;
}
