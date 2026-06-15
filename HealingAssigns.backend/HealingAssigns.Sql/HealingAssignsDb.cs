using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Sql;

public class HealingAssignsDb : DbContext
{
    public HealingAssignsDb(DbContextOptions<HealingAssignsDb> options) : base(options) { }

    public DbSet<WeatherForecast> WeatherForecasts => Set<WeatherForecast>();
}
