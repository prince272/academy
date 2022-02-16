using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Server.Templates
{
    public static class Extensions
    {
        public static async Task<HtmlString> ImportUrlContentAsync(this RazorPage razor, string path)
        {
            var contentBuilder = new StringBuilder();
            contentBuilder.Append("data:image/")
                .Append(Path.GetExtension(path).Replace(".", ""))
                .Append(";base64,")
                .Append(Convert.ToBase64String(await IOHelper.ConvertToBytesAsync(GetContentStream(razor, path))));
            return new HtmlString(contentBuilder.ToString());
        }

        static Stream GetContentStream(this RazorPage razor, string path)
        {
            var services = razor.Context.RequestServices;
            var webEnvironment = services.GetRequiredService<IWebHostEnvironment>();
            var razorViewRendererOptions = services.GetRequiredService<IOptions<RazorViewRendererOptions>>();

            var fileInfo = webEnvironment.ContentRootFileProvider.GetFileInfo(string.Format(razorViewRendererOptions.Value.RootPathFormat, path).Replace("/", "\\"));
            return fileInfo.CreateReadStream();
        }

        public static async Task<HtmlString> ImportContentAsync(this RazorPage razor, string path)
        {
            var services = razor.Context.RequestServices;
            var webEnvironment = services.GetRequiredService<IWebHostEnvironment>();
            var razorViewRendererOptions = services.GetRequiredService<IOptions<RazorViewRendererOptions>>();

            var fileInfo = webEnvironment.ContentRootFileProvider.GetFileInfo(string.Format(razorViewRendererOptions.Value.RootPathFormat, path).Replace("/", "\\"));
            return new HtmlString(await IOHelper.ConvertToStringAsync(fileInfo.CreateReadStream()));
        }
    }
}
