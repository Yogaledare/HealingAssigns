using HealingAssigns.Api;
using HealingAssigns.Sql;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<HealingAssignsDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<WeatherService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HealingAssignsDb>();
    await db.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapPost("/weatherforecast", async (WeatherService service) =>
{
    var forecast = await service.GenerateAndSave();
    return Results.Created($"/weatherforecast/{forecast.Id}", forecast);
});

app.MapGet("/weatherforecast", async (WeatherService service) =>
{
    return await service.GetAll();
});

app.Run();
