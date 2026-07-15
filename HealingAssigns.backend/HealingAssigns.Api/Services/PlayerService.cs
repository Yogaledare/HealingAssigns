using System.Text.RegularExpressions;
using HealingAssigns.Contracts;
using HealingAssigns.Sql;
using HealingAssigns.Sql.Entities;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api.Services;

public partial class PlayerService(HealingAssignsDb db, LookupCache lookup)
{
    private static readonly Func<Player, PlayerDto> MapToDto = p => p.ToDto();

    private IQueryable<Player> PlayersWithIncludes => db.Players
        .Include(p => p.Spec).ThenInclude(s => s.PlayerClass)
        .Include(p => p.Spec).ThenInclude(s => s.Role);

    public async Task<List<PlayerDto>> GetAll()
    {
        var players = await PlayersWithIncludes
            .OrderBy(p => p.Spec.RoleId)
                .ThenBy(p => p.Spec.PlayerClassId)
                .ThenBy(p => p.Name)
            .ToListAsync();

        return players.Select(MapToDto).ToList();
    }

    public async Task<(PlayerDto? Dto, bool IsNew)> Create(string name, int specId)
    {
        var spec = await db.Specs
            .Include(s => s.PlayerClass)
            .Include(s => s.Role)
            .FirstOrDefaultAsync(s => s.Id == specId);
        if (spec is null) return (null, false);

        var existing = await PlayersWithIncludes
            .FirstOrDefaultAsync(p => p.Name == name);

        if (existing is not null)
        {
            existing.IsActive = true;
            existing.LastActivatedAt = DateTime.UtcNow;
            if (existing.SpecId != specId)
            {
                existing.SpecId = specId;
                existing.Spec = spec;
            }
            await db.SaveChangesAsync();
            return (existing.ToDto(), false);
        }

        var player = new Player
        {
            Name = name.Trim(),
            SpecId = specId,
            IsActive = true,
            LastActivatedAt = DateTime.UtcNow
        };
        db.Players.Add(player);
        await db.SaveChangesAsync();

        player.Spec = spec;
        return (player.ToDto(), true);
    }

    public async Task<PlayerDto?> Update(int id, string name, int specId)
    {
        var player = await PlayersWithIncludes.FirstOrDefaultAsync(p => p.Id == id);
        if (player is null) return null;

        var spec = await db.Specs
            .Include(s => s.PlayerClass)
            .Include(s => s.Role)
            .FirstOrDefaultAsync(s => s.Id == specId);
        if (spec is null) return null;

        player.Name = name.Trim();
        player.SpecId = specId;
        player.Spec = spec;
        await db.SaveChangesAsync();
        return player.ToDto();
    }

    public async Task<bool> Delete(int id)
    {
        var player = await db.Players.FindAsync(id);
        if (player is null) return false;
        db.Players.Remove(player);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<PlayerDto?> Activate(int id)
    {
        var player = await PlayersWithIncludes.FirstOrDefaultAsync(p => p.Id == id);
        if (player is null) return null;
        player.IsActive = true;
        player.LastActivatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return player.ToDto();
    }

    public async Task<PlayerDto?> Deactivate(int id)
    {
        var player = await PlayersWithIncludes.FirstOrDefaultAsync(p => p.Id == id);
        if (player is null) return null;
        player.IsActive = false;
        await db.SaveChangesAsync();
        return player.ToDto();
    }

    public async Task<int> DeactivateAll()
    {
        return await db.Players
            .Where(p => p.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsActive, false));
    }

    public async Task<ImportPlayersResponse> Import(string text)
    {
        var parsed = ParseRaidHelper(text);
        var existingPlayers = await db.Players.ToDictionaryAsync(p => p.Name, StringComparer.OrdinalIgnoreCase);
        var results = new List<ImportedPlayerDto>();
        var now = DateTime.UtcNow;

        foreach (var entry in parsed)
        {
            var specId = entry.SpecKey is not null ? lookup.SpecIdByRaidHelperKey(entry.SpecKey) : null;
            var specRef = specId.HasValue
                ? lookup.References.Specs.FirstOrDefault(s => s.Id == specId.Value)
                : null;
            var classRef = specRef is not null
                ? lookup.References.PlayerClasses.FirstOrDefault(c => c.Id == specRef.PlayerClassId)
                : null;

            if (specId is null)
            {
                results.Add(new ImportedPlayerDto(entry.Name, null, null, "skipped", entry.SignupStatus));
                continue;
            }

            if (existingPlayers.TryGetValue(entry.Name, out var existing))
            {
                existing.IsActive = true;
                existing.LastActivatedAt = now;
                if (existing.SpecId != specId.Value)
                {
                    existing.SpecId = specId.Value;
                    results.Add(new ImportedPlayerDto(entry.Name, specRef?.Name, classRef?.Name, "updated", entry.SignupStatus));
                }
                else
                {
                    results.Add(new ImportedPlayerDto(entry.Name, specRef?.Name, classRef?.Name, "unchanged", entry.SignupStatus));
                }
            }
            else
            {
                var player = new Player
                {
                    Name = entry.Name,
                    SpecId = specId.Value,
                    IsActive = true,
                    LastActivatedAt = now
                };
                db.Players.Add(player);
                existingPlayers[entry.Name] = player;
                results.Add(new ImportedPlayerDto(entry.Name, specRef?.Name, classRef?.Name, "created", entry.SignupStatus));
            }
        }

        await db.SaveChangesAsync();
        return new ImportPlayersResponse(results);
    }

    private record ParsedEntry(string Name, string? SpecKey, string SignupStatus);

    [GeneratedRegex(@":(\w+):\s+(\d+)\s+(.+?)(?:,|$)")]
    private static partial Regex SpecLineRegex();

    [GeneratedRegex(@"(\d+)\s+(.+?)(?:,|$)")]
    private static partial Regex AbsenceEntryRegex();

    private static List<ParsedEntry> ParseRaidHelper(string text)
    {
        var entries = new List<ParsedEntry>();
        var lines = text.Split('\n');
        var currentSignupStatus = "signed";

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line)) continue;

            if (line.StartsWith(":Tentative:"))
            {
                currentSignupStatus = "tentative";
                var afterColon = line.IndexOf(" : ");
                if (afterColon >= 0)
                {
                    var inlineContent = line[(afterColon + 3)..];
                    foreach (Match m in SpecLineRegex().Matches(inlineContent))
                        entries.Add(new ParsedEntry(m.Groups[3].Value.Trim(), m.Groups[1].Value, "tentative"));
                }
                continue;
            }

            if (line.StartsWith(":Absence:"))
            {
                currentSignupStatus = "absent";
                var afterColon = line.IndexOf(" : ");
                if (afterColon >= 0)
                {
                    var inlineContent = line[(afterColon + 3)..];
                    foreach (Match m in AbsenceEntryRegex().Matches(inlineContent))
                        entries.Add(new ParsedEntry(m.Groups[2].Value.Trim(), null, "absent"));
                }
                continue;
            }

            if (line.StartsWith(":Bench:"))
            {
                currentSignupStatus = "bench";
                var afterColon = line.IndexOf(" : ");
                if (afterColon >= 0)
                {
                    var inlineContent = line[(afterColon + 3)..];
                    foreach (Match m in SpecLineRegex().Matches(inlineContent))
                        entries.Add(new ParsedEntry(m.Groups[3].Value.Trim(), m.Groups[1].Value, "bench"));
                }
                continue;
            }

            if (line.StartsWith(":") && line.Contains(':') && currentSignupStatus == "signed")
            {
                var match = SpecLineRegex().Match(line);
                if (match.Success)
                {
                    var specKey = match.Groups[1].Value;
                    var name = match.Groups[3].Value.Trim();
                    if (!IsHeaderKey(specKey))
                        entries.Add(new ParsedEntry(name, specKey, "signed"));
                }
            }
        }

        return entries;
    }

    private static bool IsHeaderKey(string key) =>
        key is "Tank" or "Warrior" or "Druid" or "Paladin" or "Rogue" or "Hunter"
            or "Priest" or "Mage" or "Warlock" or "Shaman" or "Tanks" or "Dps"
            or "Ranged" or "Healers" or "LeaderX" or "DateX" or "Date"
            or "SignUpsX" or "SignUps" or "TimeX" or "Time"
            or "CountdownX" or "Countdown" or "Tentative" or "Absence" or "Bench"
            or "T" or "K" or "S" or "C" or "plus";
}

file static class PlayerMappingExtensions
{
    public static PlayerDto ToDto(this Player p) => new(
        p.Id, p.Name,
        p.SpecId, p.Spec.Name,
        p.Spec.PlayerClassId, p.Spec.PlayerClass.Name, p.Spec.PlayerClass.Color,
        p.Spec.RoleId, p.Spec.Role.Name,
        p.IsActive, p.LastActivatedAt);
}
