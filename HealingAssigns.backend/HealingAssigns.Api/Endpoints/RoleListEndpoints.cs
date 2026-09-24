using HealingAssigns.Api.Services;
using HealingAssigns.Contracts;

namespace HealingAssigns.Api.Endpoints;

public static class RoleListEndpoints
{
    public static void MapRoleListEndpoints(this WebApplication app)
    {
        app.MapPost("/sessions/{sessionId}/rolelists", async (int sessionId, CreateRoleListRequest req, RoleListService svc) =>
        {
            var roleList = await svc.Create(sessionId, req.Name, req.Icon);
            return Results.Created($"/rolelists/{roleList.Id}", roleList);
        }).RequireAuthorization();

        app.MapPut("/rolelists/{id}", async (int id, UpdateRoleListRequest req, RoleListService svc) =>
            await svc.Update(id, req.Name, req.Icon) is { } r ? Results.Ok(r) : Results.NotFound())
            .RequireAuthorization();

        app.MapDelete("/rolelists/{id}", async (int id, RoleListService svc) =>
            await svc.Delete(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization();

        app.MapPost("/rolelists/{roleListId}/slots", async (int roleListId, RoleListService svc) =>
        {
            var slot = await svc.AddSlot(roleListId);
            return slot is not null ? Results.Created($"/slots/{slot.Id}", slot) : Results.NotFound();
        }).RequireAuthorization();

        app.MapPut("/slots/{id}/player", async (int id, SetSlotPlayerRequest req, RoleListService svc) =>
            await svc.SetSlotPlayer(id, req.PlayerId) is { } s ? Results.Ok(s) : Results.NotFound())
            .RequireAuthorization();

        app.MapDelete("/slots/{id}", async (int id, RoleListService svc) =>
            await svc.DeleteSlot(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization();

        app.MapPut("/rolelists/{roleListId}/slots/reorder", async (int roleListId, ReorderSlotsRequest req, RoleListService svc) =>
        {
            await svc.ReorderSlots(roleListId, req.SlotIds);
            return Results.NoContent();
        }).RequireAuthorization();
    }
}
