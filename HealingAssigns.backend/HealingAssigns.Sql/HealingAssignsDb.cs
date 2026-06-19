using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Sql;

public class HealingAssignsDb : DbContext
{
    public HealingAssignsDb(DbContextOptions<HealingAssignsDb> options) : base(options) { }

    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<RoleList> RoleLists => Set<RoleList>();
    public DbSet<RoleSlot> RoleSlots => Set<RoleSlot>();
    public DbSet<Encounter> Encounters => Set<Encounter>();
    public DbSet<Assignment> Assignments => Set<Assignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleSlot>()
            .HasOne(s => s.RoleList)
            .WithMany(r => r.Slots)
            .HasForeignKey(s => s.RoleListId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Encounter)
            .WithMany(e => e.Assignments)
            .HasForeignKey(a => a.EncounterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.AssigneeRoleList)
            .WithMany()
            .HasForeignKey(a => a.AssigneeRoleListId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.TargetRoleList)
            .WithMany()
            .HasForeignKey(a => a.TargetRoleListId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
