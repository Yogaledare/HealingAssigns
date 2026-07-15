using HealingAssigns.Api.Services;
using HealingAssigns.Contracts;

namespace HealingAssigns.Api.Endpoints;

public static class PlayerEndpoints
{
    public static void MapPlayerEndpoints(this WebApplication app)
    {
        app.MapGet("/players", async (PlayerService svc) =>
            Results.Ok(await svc.GetAll()));

        app.MapPost("/players", async (CreatePlayerRequest req, PlayerService svc) =>
        {
            var (player, isNew) = await svc.Create(req.Name, req.SpecId);
            if (player is null) return Results.BadRequest();
            return isNew
                ? Results.Created($"/players/{player.Id}", player)
                : Results.Ok(player);
        }).RequireAuthorization();

        app.MapPut("/players/{id}", async (int id, UpdatePlayerRequest req, PlayerService svc) =>
            await svc.Update(id, req.Name, req.SpecId) is { } p ? Results.Ok(p) : Results.NotFound())
            .RequireAuthorization();

        app.MapDelete("/players/{id}", async (int id, PlayerService svc) =>
            await svc.Delete(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization();

        app.MapPost("/players/{id}/activate", async (int id, PlayerService svc) =>
            await svc.Activate(id) is { } p ? Results.Ok(p) : Results.NotFound())
            .RequireAuthorization();

        app.MapPost("/players/{id}/deactivate", async (int id, PlayerService svc) =>
            await svc.Deactivate(id) is { } p ? Results.Ok(p) : Results.NotFound())
            .RequireAuthorization();

        app.MapPost("/players/deactivate-all", async (PlayerService svc) =>
            Results.Ok(new { count = await svc.DeactivateAll() }))
            .RequireAuthorization();

        app.MapPost("/players/import", async (ImportPlayersRequest req, PlayerService svc) =>
            Results.Ok(await svc.Import(req.Text)))
            .RequireAuthorization();
    }
}
