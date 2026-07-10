namespace HealingAssigns.Sql.Entities;

public class RoleSlot
{
    public int Id { get; set; }
    public int RoleListId { get; set; }
    public string PlayerName { get; set; } = "";
    public int? PlayerClassId { get; set; }
    public int SortOrder { get; set; }

    public RoleList RoleList { get; set; } = null!;
    public PlayerClass? PlayerClass { get; set; }
}
