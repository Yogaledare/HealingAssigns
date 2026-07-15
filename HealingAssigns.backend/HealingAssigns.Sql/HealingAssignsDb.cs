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
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Spec> Specs => Set<Spec>();
    public DbSet<Player> Players => Set<Player>();

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

        modelBuilder.Entity<RoleSlot>()
            .HasOne(s => s.Player)
            .WithMany()
            .HasForeignKey(s => s.PlayerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Spec>()
            .HasOne(s => s.PlayerClass)
            .WithMany()
            .HasForeignKey(s => s.PlayerClassId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Spec>()
            .HasOne(s => s.Role)
            .WithMany()
            .HasForeignKey(s => s.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Spec>()
            .HasIndex(s => s.RaidHelperKey)
            .IsUnique();

        modelBuilder.Entity<Player>()
            .HasOne(p => p.Spec)
            .WithMany()
            .HasForeignKey(p => p.SpecId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Player>()
            .HasIndex(p => p.Name)
            .IsUnique();

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

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Healer" },
            new Role { Id = 2, Name = "Tank" },
            new Role { Id = 3, Name = "Dps" }
        );

        modelBuilder.Entity<Spec>().HasData(
            // Warrior (ClassId=1)
            new Spec { Id = 1, Name = "Arms", RaidHelperKey = "Arms", PlayerClassId = 1, RoleId = 3 },
            new Spec { Id = 2, Name = "Fury", RaidHelperKey = "Fury", PlayerClassId = 1, RoleId = 3 },
            new Spec { Id = 3, Name = "Protection", RaidHelperKey = "Protection", PlayerClassId = 1, RoleId = 2 },
            // Priest (ClassId=2)
            new Spec { Id = 4, Name = "Discipline", RaidHelperKey = "Discipline", PlayerClassId = 2, RoleId = 1 },
            new Spec { Id = 5, Name = "Holy", RaidHelperKey = "Holy", PlayerClassId = 2, RoleId = 1 },
            new Spec { Id = 6, Name = "Shadow", RaidHelperKey = "Shadow", PlayerClassId = 2, RoleId = 3 },
            // Mage (ClassId=3)
            new Spec { Id = 7, Name = "Arcane", RaidHelperKey = "Arcane", PlayerClassId = 3, RoleId = 3 },
            new Spec { Id = 8, Name = "Fire", RaidHelperKey = "Fire", PlayerClassId = 3, RoleId = 3 },
            new Spec { Id = 9, Name = "Frost", RaidHelperKey = "Frost", PlayerClassId = 3, RoleId = 3 },
            // Druid (ClassId=4)
            new Spec { Id = 10, Name = "Balance", RaidHelperKey = "Balance", PlayerClassId = 4, RoleId = 3 },
            new Spec { Id = 11, Name = "Feral", RaidHelperKey = "Feral", PlayerClassId = 4, RoleId = 3 },
            new Spec { Id = 12, Name = "Guardian", RaidHelperKey = "Guardian", PlayerClassId = 4, RoleId = 2 },
            new Spec { Id = 13, Name = "Restoration", RaidHelperKey = "Restoration", PlayerClassId = 4, RoleId = 1 },
            new Spec { Id = 14, Name = "Dreamstate", RaidHelperKey = "Dreamstate", PlayerClassId = 4, RoleId = 1 },
            // Hunter (ClassId=5)
            new Spec { Id = 15, Name = "Beast Mastery", RaidHelperKey = "Beastmastery", PlayerClassId = 5, RoleId = 3 },
            new Spec { Id = 16, Name = "Marksmanship", RaidHelperKey = "Marksmanship", PlayerClassId = 5, RoleId = 3 },
            new Spec { Id = 17, Name = "Survival", RaidHelperKey = "Survival", PlayerClassId = 5, RoleId = 3 },
            // Rogue (ClassId=6)
            new Spec { Id = 18, Name = "Assassination", RaidHelperKey = "Assassination", PlayerClassId = 6, RoleId = 3 },
            new Spec { Id = 19, Name = "Combat", RaidHelperKey = "Combat", PlayerClassId = 6, RoleId = 3 },
            new Spec { Id = 20, Name = "Subtlety", RaidHelperKey = "Subtlety", PlayerClassId = 6, RoleId = 3 },
            // Shaman (ClassId=7)
            new Spec { Id = 21, Name = "Elemental", RaidHelperKey = "Elemental", PlayerClassId = 7, RoleId = 3 },
            new Spec { Id = 22, Name = "Enhancement", RaidHelperKey = "Enhancement", PlayerClassId = 7, RoleId = 3 },
            new Spec { Id = 23, Name = "Restoration", RaidHelperKey = "Restoration1", PlayerClassId = 7, RoleId = 1 },
            // Paladin (ClassId=8)
            new Spec { Id = 24, Name = "Holy", RaidHelperKey = "Holy1", PlayerClassId = 8, RoleId = 1 },
            new Spec { Id = 25, Name = "Protection", RaidHelperKey = "Protection1", PlayerClassId = 8, RoleId = 2 },
            new Spec { Id = 26, Name = "Retribution", RaidHelperKey = "Retribution", PlayerClassId = 8, RoleId = 3 },
            // Warlock (ClassId=9)
            new Spec { Id = 27, Name = "Affliction", RaidHelperKey = "Affliction", PlayerClassId = 9, RoleId = 3 },
            new Spec { Id = 28, Name = "Demonology", RaidHelperKey = "Demonology", PlayerClassId = 9, RoleId = 3 },
            new Spec { Id = 29, Name = "Destruction", RaidHelperKey = "Destruction", PlayerClassId = 9, RoleId = 3 }
        );
    }
}
