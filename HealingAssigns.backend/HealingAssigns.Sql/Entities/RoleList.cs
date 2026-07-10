namespace HealingAssigns.Sql.Entities;

public class RoleList
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public string Name { get; set; } = "";
    public string? Icon { get; set; }
    public int SortOrder { get; set; }

    public Session Session { get; set; } = null!;
    public List<RoleSlot> Slots { get; set; } = [];
}
