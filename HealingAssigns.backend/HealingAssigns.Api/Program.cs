using System.Text.Json.Serialization;
using HealingAssigns.Api.Endpoints;
using HealingAssigns.Api.Services;
using HealingAssigns.Sql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

builder.Services.AddOpenApi();
builder.Services.AddDbContext<HealingAssignsDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<SessionService>();
builder.Services.AddScoped<RoleListService>();
builder.Services.AddScoped<EncounterService>();
builder.Services.AddScoped<AssignmentService>();
builder.Services.AddSingleton<LookupCache>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var clientId = builder.Configuration["Auth:Google:ClientId"]
            ?? throw new InvalidOperationException("Auth:Google:ClientId is not configured");

        options.Authority = "https://accounts.google.com";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = "https://accounts.google.com",
            ValidAudience = clientId,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true
        };
    });
builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HealingAssignsDb>();
    await db.Database.EnsureCreatedAsync();
    await scope.ServiceProvider.GetRequiredService<LookupCache>().Load(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapSessionEndpoints();
app.MapRoleListEndpoints();
app.MapEncounterEndpoints();
app.MapAssignmentEndpoints();
app.MapReferenceEndpoints();

app.Run();
