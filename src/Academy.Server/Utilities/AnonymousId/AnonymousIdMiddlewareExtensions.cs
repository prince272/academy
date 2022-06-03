using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Academy.Server.Utilities.AnonymousId
{
    public static class AnonymousIdMiddlewareExtensions
    {
        public static IServiceCollection AddAnonymousId(this IServiceCollection services, Action<AnonymousIdCookieOptionsBuilder> configure)
        {
            return services.Configure(configure);
        }

        public static IApplicationBuilder UseAnonymousId(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AnonymousIdMiddleware>();
        }
    }
}