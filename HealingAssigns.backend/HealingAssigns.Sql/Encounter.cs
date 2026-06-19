namespace HealingAssigns.Sql;

public class Encounter
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }

    public Session Session { get; set; } = null!;
    public List<Assignment> Assignments { get; set; } = [];
}
