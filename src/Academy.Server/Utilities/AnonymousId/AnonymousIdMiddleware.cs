using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System;
using System.Threading.Tasks;

namespace Academy.Server.Utilities.AnonymousId
{
    public class AnonymousIdMiddleware
    {
        private RequestDelegate nextDelegate;
        private AnonymousIdCookieOptionsBuilder cookieOptionsBuilder;

        public AnonymousIdMiddleware(RequestDelegate nextDelegate, IOptions<AnonymousIdCookieOptionsBuilder> cookieOptionsBuilder)
        {
            this.nextDelegate = nextDelegate;
            this.cookieOptionsBuilder = cookieOptionsBuilder.Value;
        }

        public async Task Invoke(HttpContext httpContext)
        {
            HandleRequest(httpContext);
            await nextDelegate.Invoke(httpContext);
        }

        public void HandleRequest(HttpContext httpContext)
        {
            var cookieOptions = cookieOptionsBuilder.Build(httpContext);
            var encodedData = httpContext.Request.Cookies[cookieOptions.Name];

            // Handle secure cookies over an unsecured connection.
            if (cookieOptions.Secure && !httpContext.Request.IsHttps)
            {
                if (!string.IsNullOrWhiteSpace(encodedData))
                    httpContext.Response.Cookies.Delete(cookieOptions.Name);

                // Adds the feature to request collection.
                httpContext.Features.Set<IAnonymousIdFeature>(new AnonymousIdFeature());
            }
            else
            {
                // Gets the value and anonymous Id data from the cookie, if available.
                var decodedData = AnonymousIdEncoder.Decode(encodedData);

                if (decodedData != null && !string.IsNullOrWhiteSpace(decodedData.AnonymousId))
                {
                    // Adds the feature to request collection.
                    httpContext.Features.Set<IAnonymousIdFeature>(new AnonymousIdFeature() { AnonymousId = decodedData.AnonymousId });
                }
                else
                {
                    cookieOptions.Expires = DateTime.UtcNow.AddSeconds(cookieOptions.Timeout);

                    var data = new AnonymousIdData(Guid.NewGuid().ToString(), cookieOptions.Expires.Value.DateTime);
                    encodedData = AnonymousIdEncoder.Encode(data);

                    httpContext.Response.Cookies.Append(cookieOptions.Name, encodedData, cookieOptions);

                    httpContext.Features.Set<IAnonymousIdFeature>(new AnonymousIdFeature() { AnonymousId = data.AnonymousId });
                }
            }
        }
    }
}