using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Server.Utilities
{
    public static class HttpRequestExtentions
    {
        public static string AbsoluteUrl(this HttpRequest request, string relativePath)
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