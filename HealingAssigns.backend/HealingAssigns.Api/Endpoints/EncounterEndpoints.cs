using HealingAssigns.Api.Services;
using HealingAssigns.Contracts;

namespace HealingAssigns.Api.Endpoints;

public static class EncounterEndpoints
{
    public static void MapEncounterEndpoints(this WebApplication app)
    {
        app.MapPost("/sessions/{sessionId}/encounters", async (int sessionId, CreateEncounterRequest req, EncounterService svc) =>
        {
            var encounter = await svc.Create(sessionId, req.Name);
            return Results.Created($"/encounters/{encounter.Id}", encounter);
        }).RequireAuthorization();

        app.MapPut("/encounters/{id}", async (int id, UpdateEncounterRequest req, EncounterService svc) =>
            await svc.Update(id, req.Name) is { } e ? Results.Ok(e) : Results.NotFound())
            .RequireAuthorization();

        app.MapDelete("/encounters/{id}", async (int id, EncounterService svc) =>
            await svc.Delete(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization();
    }
}
