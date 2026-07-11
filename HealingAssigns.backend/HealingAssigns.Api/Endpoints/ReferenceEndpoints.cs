using HealingAssigns.Sql;

namespace HealingAssigns.Api.Endpoints;

public static class ReferenceEndpoints
{
    public static void MapReferenceEndpoints(this WebApplication app)
    {
        app.MapGet("/references", (LookupCache lookup) => Results.Ok(lookup.References));
    }
}
