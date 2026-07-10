using HealingAssigns.Sql;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public class LookupCache
{
    private Dictionary<int, string> _symbols = new();
    private Dictionary<int, string> _playerClasses = new();

    public async Task Load(HealingAssignsDb db)
    {
        _symbols = await db.Symbols.ToDictionaryAsync(s => s.Id, s => s.Name);
        _playerClasses = await db.PlayerClasses.ToDictionaryAsync(c => c.Id, c => c.Name);
    }

    public string? SymbolName(int? id) =>
        id.HasValue && _symbols.TryGetValue(id.Value, out var name) ? name : null;

    public string? PlayerClassName(int? id) =>
        id.HasValue && _playerClasses.TryGetValue(id.Value, out var name) ? name : null;
}
