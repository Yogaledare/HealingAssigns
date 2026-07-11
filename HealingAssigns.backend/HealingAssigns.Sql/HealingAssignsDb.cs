using HealingAssigns.Sql.Entities;
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
    public DbSet<Symbol> Symbols => Set<Symbol>();
    public DbSet<PlayerClass> PlayerClasses => Set<PlayerClass>();

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

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Symbol)
            .WithMany()
            .HasForeignKey(a => a.SymbolId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoleList>()
            .HasIndex(r => new { r.SessionId, r.SortOrder })
            .IsUnique();

        modelBuilder.Entity<RoleSlot>()
            .HasIndex(s => new { s.RoleListId, s.SortOrder })
            .IsUnique();

        modelBuilder.Entity<Encounter>()
            .HasIndex(e => new { e.SessionId, e.SortOrder })
            .IsUnique();

        modelBuilder.Entity<Assignment>()
            .HasIndex(a => new { a.EncounterId, a.SortOrder })
            .IsUnique();

        modelBuilder.Entity<RoleSlot>()
            .HasOne(s => s.PlayerClass)
            .WithMany()
            .HasForeignKey(s => s.PlayerClassId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PlayerClass>().HasData(
            new PlayerClass { Id = 1, Name = "Warrior", Color = "#C69B6D", Icon = "⚔️" },
            new PlayerClass { Id = 2, Name = "Priest", Color = "#FFFFFF", Icon = "🙏" },
            new PlayerClass { Id = 3, Name = "Mage", Color = "#3FC7EB", Icon = "🔮" },
            new PlayerClass { Id = 4, Name = "Druid", Color = "#FF7C0A", Icon = "🌿" },
            new PlayerClass { Id = 5, Name = "Hunter", Color = "#AAD372", Icon = "🏹" },
            new PlayerClass { Id = 6, Name = "Rogue", Color = "#FFF468", Icon = "🗡️" },
            new PlayerClass { Id = 7, Name = "Shaman", Color = "#0070DD", Icon = "⚡" },
            new PlayerClass { Id = 8, Name = "Paladin", Color = "#F48CBA", Icon = "⚜️" },
            new PlayerClass { Id = 9, Name = "Warlock", Color = "#8788EE", Icon = "😈" }
        );

        modelBuilder.Entity<Symbol>().HasData(
            new Symbol { Id = 1, Name = "Skull", Icon = "💀" },
            new Symbol { Id = 2, Name = "Star", Icon = "⭐" },
            new Symbol { Id = 3, Name = "Circle", Icon = "🟠" },
            new Symbol { Id = 4, Name = "Diamond", Icon = "🔶" },
            new Symbol { Id = 5, Name = "Triangle", Icon = "🔺" },
            new Symbol { Id = 6, Name = "Square", Icon = "🟦" },
            new Symbol { Id = 7, Name = "Moon", Icon = "🌙" },
            new Symbol { Id = 8, Name = "Cross", Icon = "❌" }
        );
    }
}
