namespace HealingAssigns.Sql.Entities;

public class RoleList
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }

    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;

    public int? RoleId { get; set; }
    public Role? Role { get; set; }

    public List<RoleSlot> Slots { get; set; } = [];
}
