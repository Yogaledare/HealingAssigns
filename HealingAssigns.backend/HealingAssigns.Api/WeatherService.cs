using HealingAssigns.Sql;
using Microsoft.EntityFrameworkCore;

namespace HealingAssigns.Api;

public class WeatherService(HealingAssignsDb db)
{
    private static readonly string[] Summaries =
        ["Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

    public async Task<WeatherForecast> GenerateAndSave()
    {
        var forecast = new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(Random.Shared.Next(1, 10))),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        };

        db.WeatherForecasts.Add(forecast);
        await db.SaveChangesAsync();
        return forecast;
    }

    public async Task<List<WeatherForecast>> GetAll()
    {
        return await db.WeatherForecasts.OrderByDescending(w => w.CreatedAt).ToListAsync();
    }
}
