using HealingAssigns.Api.Services;
using HealingAssigns.Contracts;

namespace HealingAssigns.Api.Endpoints;

public static class AssignmentEndpoints
{
    public static void MapAssignmentEndpoints(this WebApplication app)
    {
        app.MapPost("/encounters/{encounterId}/assignments", async (int encounterId, CreateAssignmentRequest req, AssignmentService svc) =>
        {
            var assignment = await svc.Create(encounterId, req.Symbol, req.Description,
                req.AssigneeRoleListId, req.AssigneePosition, req.TargetRoleListId, req.TargetPosition);
            return Results.Created($"/assignments/{assignment.Id}", assignment);
        }).RequireAuthorization();

        app.MapPut("/assignments/{id}", async (int id, UpdateAssignmentRequest req, AssignmentService svc) =>
            await svc.Update(id, req.Symbol, req.Description,
                req.AssigneeRoleListId, req.AssigneePosition, req.TargetRoleListId, req.TargetPosition) is { } a
                ? Results.Ok(a) : Results.NotFound())
            .RequireAuthorization();

        app.MapDelete("/assignments/{id}", async (int id, AssignmentService svc) =>
            await svc.Delete(id) ? Results.NoContent() : Results.NotFound())
            .RequireAuthorization();
    }
}
