using Microsoft.EntityFrameworkCore;

namespace Uno.Server.Persistence;

public class UnoDbContext : DbContext
{
    public UnoDbContext(DbContextOptions<UnoDbContext> options) : base(options) { }

    public DbSet<MatchHistory> MatchHistories => Set<MatchHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MatchHistory>(e =>
        {
            e.ToTable("match_history");
            e.HasKey(x => x.Id);
            e.Property(x => x.RoomCode).HasMaxLength(6).IsRequired();
            e.Property(x => x.RulesJson).IsRequired();
            e.Property(x => x.PlayersJson).IsRequired();
            e.Property(x => x.WinnerId).IsRequired();
            e.Property(x => x.WinnerName).IsRequired();
        });
    }
}
