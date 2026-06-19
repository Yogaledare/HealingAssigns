using System.Security.Claims;
using HealingAssigns.Api.Services;
using HealingAssigns.Contracts;

namespace HealingAssigns.Api.Endpoints;

public static class SessionEndpoints
{
    public static void MapSessionEndpoints(this WebApplication app)
    {
        app.MapGet("/sessions", async (SessionService svc) => await svc.GetAll());

        app.MapGet("/sessions/{id}", async (int id, SessionService svc) =>
            await svc.Get(id) is { } session ? Results.Ok(session) : Results.NotFound());

        app.MapPost("/sessions", async (CreateSessionRequest req, SessionService svc) =>
        {
            var session = await svc.Create(req.Name);
            return Results.Created($"/sessions/{session.Id}", session);
        }).RequireAuthorization();

        app.MapPut("/sessions/{id}", async (int id, UpdateSessionRequest req, SessionService svc) =>
            await svc.Update(id, req.Name) is { } session ? Results.Ok(session) : Results.NotFound())
            .RequireAuthorization();

        app.MapGet("/me", (ClaimsPrincipal user) => Results.Ok(new
        {
            Email = user.FindFirstValue(ClaimTypes.Email),
            Name = user.FindFirstValue(ClaimTypes.Name),
            Picture = user.FindFirstValue("picture")
        })).RequireAuthorization();
    }
}
