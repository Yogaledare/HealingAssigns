namespace HealingAssigns.Sql.Entities;

public class Assignment
{
    public int Id { get; set; }
    public string? Description { get; set; }
    public int AssigneePosition { get; set; }
    public int? TargetPosition { get; set; }
    public int SortOrder { get; set; }

    public int EncounterId { get; set; }
    public Encounter Encounter { get; set; } = null!;
    
    public int? SymbolId { get; set; }
    public Symbol? Symbol { get; set; }
    
    public int AssigneeRoleListId { get; set; }
    public RoleList AssigneeRoleList { get; set; } = null!;
    
    public int? TargetRoleListId { get; set; }
    public RoleList? TargetRoleList { get; set; }
}
