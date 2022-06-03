using Microsoft.AspNetCore.Builder;

namespace Academy.Server.Utilities.AnonymousId
{
    public static class AnonymousIdMiddlewareExtensions
    {
        public static IApplicationBuilder UseAnonymousId(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AnonymousIdMiddleware>(new AnonymousIdCookieOptionsBuilder().Build());
        }

        public static IApplicationBuilder UseAnonymousId(this IApplicationBuilder builder, AnonymousIdCookieOptionsBuilder options)
        {
            return builder.UseMiddleware<AnonymousIdMiddleware>(options.Build());
        }
    }
}