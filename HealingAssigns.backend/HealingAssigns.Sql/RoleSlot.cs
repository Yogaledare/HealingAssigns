namespace HealingAssigns.Sql;

public class RoleSlot
{
    public int Id { get; set; }
    public int RoleListId { get; set; }
    public string PlayerName { get; set; } = "";
    public string? ClassName { get; set; }
    public string? ClassColor { get; set; }
    public int SortOrder { get; set; }

    public RoleList RoleList { get; set; } = null!;
}
