namespace HealingAssigns.Sql.Entities;

public class RoleSlot
{
    public int Id { get; set; }
    public int SortOrder { get; set; }

    public int RoleListId { get; set; }
    public RoleList RoleList { get; set; } = null!;

    public int? PlayerId { get; set; }
    public Player? Player { get; set; }
}
