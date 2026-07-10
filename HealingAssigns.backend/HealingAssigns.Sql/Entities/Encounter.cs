namespace HealingAssigns.Sql.Entities;

public class Encounter
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }

    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;

    public List<Assignment> Assignments { get; set; } = [];
}
