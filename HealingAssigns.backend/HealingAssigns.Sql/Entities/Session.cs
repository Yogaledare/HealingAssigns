namespace HealingAssigns.Sql.Entities;

public class Session
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<RoleList> RoleLists { get; set; } = [];
    public List<Encounter> Encounters { get; set; } = [];
}
