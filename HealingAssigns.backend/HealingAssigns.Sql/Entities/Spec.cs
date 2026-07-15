namespace HealingAssigns.Sql.Entities;

public class Spec
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string RaidHelperKey { get; set; } = "";

    public int PlayerClassId { get; set; }
    public PlayerClass PlayerClass { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
