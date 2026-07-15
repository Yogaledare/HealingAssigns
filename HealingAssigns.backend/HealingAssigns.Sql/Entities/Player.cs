namespace HealingAssigns.Sql.Entities;

public class Player
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime? LastActivatedAt { get; set; }

    public int SpecId { get; set; }
    public Spec Spec { get; set; } = null!;
}
