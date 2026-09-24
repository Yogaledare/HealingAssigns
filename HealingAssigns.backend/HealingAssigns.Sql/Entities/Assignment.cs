namespace HealingAssigns.Sql.Entities;

public class Assignment
{
    public int Id { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsEnabled { get; set; } = true;

    public int EncounterId { get; set; }
    public Encounter Encounter { get; set; } = null!;

    public int? ParentAssignmentId { get; set; }
    public Assignment? Parent { get; set; }
    public List<Assignment> Children { get; set; } = [];

    public int? SymbolId { get; set; }
    public Symbol? Symbol { get; set; }

    public int? SlotId { get; set; }
    public RoleSlot? Slot { get; set; }
}
