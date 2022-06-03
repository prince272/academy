using Academy.Server.Data.Entities;
using Academy.Server.Utilities.AnonymousId;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class HttpRequestExtentions
    {
        public static async Task<User> GetCurrentUserAsync(this HttpRequest httpRequest)
        {
            var userManager = httpRequest.HttpContext.RequestServices.GetRequiredService<UserManager<User>>();
            var currentUserKey = "currentUser";

            var currentUser = httpRequest.HttpContext.Items[currentUserKey] as User;

            if (currentUser == null)
            {
                var sub = userManager.GetUserId(httpRequest.HttpContext.User);

                currentUser = await userManager.Users
                    .Include(_ => _.UserRoles).ThenInclude(_ => _.Role)
                    .Include(_ => _.Certificates)
                    .Include(_ => _.CourseProgresses)
                    .FirstOrDefaultAsync(_ => _.Id.ToString() == sub);

                httpRequest.HttpContext.Items[currentUserKey] = currentUser;
            }

            return currentUser;
        }

        public static string GetIPAddress(this HttpRequest httpRequest)
        {
            var result = string.Empty;

            try
            {
                //first try to get IP address from the forwarded header
                if (httpRequest.Headers != null)
                {
                    //the X-Forwarded-For (XFF) HTTP header field is a de facto standard for identifying the originating IP address of a client
                    //connecting to a web server through an HTTP proxy or load balancer
                    var forwardedHttpHeaderKey = "X-FORWARDED-FOR";

                    var forwardedHeader = httpRequest.Headers[forwardedHttpHeaderKey];
                    if (!StringValues.IsNullOrEmpty(forwardedHeader))
                        result = forwardedHeader.FirstOrDefault();
                }

                //if this header not exists try get connection remote IP address
                if (string.IsNullOrEmpty(result) && httpRequest.HttpContext.Connection.RemoteIpAddress != null)
                    result = httpRequest.HttpContext.Connection.RemoteIpAddress.ToString();
            }
            catch { return string.Empty; }

            //some of the validation
            if (result != null && result.Equals("::1", StringComparison.OrdinalIgnoreCase))
                result = "127.0.0.1";

            //"TryParse" doesn't support IPv4 with port number
            if (IPAddress.TryParse(result ?? string.Empty, out IPAddress ip))
                //IP address is valid 
                result = ip.ToString();
            else if (!string.IsNullOrEmpty(result))
                //remove port
                result = result.Split(':').FirstOrDefault();

            return result;
        }

        public static string GetAnonymousId(this HttpRequest httpRequest)
        {
            return httpRequest.HttpContext.Features.Get<IAnonymousIdFeature>().AnonymousId;
        }

        public static string GetUAString(this HttpRequest httpRequest)
        {
            return httpRequest.Headers["User-Agent"].ToString();
        }

        public static string AbsoluteUrl(this HttpRequest request, string relativePath = null)
        {
            relativePath ??= string.Concat(request.Path.ToUriComponent(), request.QueryString.ToUriComponent());
            var absoluteUri = string.Concat(request.Scheme, "://", request.Host.ToUriComponent(), request.PathBase.ToUriComponent(), relativePath);

            return absoluteUri;
        }

        public static string RelativeUrl(this HttpRequest request)
        {
            var relativeUrl = string.Concat(
                                    request.PathBase.ToUriComponent(),
                                    request.Path.ToUriComponent(),
                                    request.QueryString.ToUriComponent());

            return relativeUrl;
        }
    }
}