using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.CacheManager;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class MediasController : ControllerBase
    {
        private readonly IStorageProvider storageProvider;
        private readonly ICacheManager cacheManager;
        private readonly IUnitOfWork unitOfWork;
        private readonly AppSettings appSettings;

        public MediasController(IServiceProvider serviceProvider)
        {
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            cacheManager = serviceProvider.GetRequiredService<ICacheManager>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload()
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher);
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var mediaName = Request.Headers["Upload-Name"].ToString();
            var mediaSize = long.Parse(Request.Headers["Upload-Size"]);

            var acceptExtensions = Request.Headers.GetCommaSeparatedValues("Accept-Extensions");

            var mediaRule = appSettings.Media.Rules.FirstOrDefault(
                _ => _.Extensions.Intersect(acceptExtensions).Contains(Path.GetExtension(mediaName), StringComparer.InvariantCultureIgnoreCase));

            if (mediaRule == null)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "The file type is not supported.");

            if (mediaSize > mediaRule.Size)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "The file size is too large.");

            var mediaType = mediaRule.Type;
            var mediaPath = MediaConstants.GetPath("uploads", mediaType, mediaName);

            var media = new Media
            {
                Name = mediaName,
                Type = mediaType,
                Path = mediaPath,
                ContentType = MimeTypeMap.GetMimeType(mediaName),
                Size = mediaSize
            };
            await unitOfWork.CreateAsync(media);

            return Result.Succeed(media);
        }

        [Authorize]
        [HttpPatch("upload/{mediaId}")]
        public async Task<IActionResult> Upload(int mediaId)
        {
            var offset = long.Parse(Request.Headers["Upload-Offset"]);

            var mediaCacheKey = $"{nameof(MediasController)}.{nameof(Upload)}-{mediaId}";
            var media = await cacheManager.GetAsync(mediaCacheKey, () => unitOfWork.Query<Media>().FirstOrDefaultAsync(_ => _.Id == mediaId));

            if (media == null) return Result.Failed(StatusCodes.Status404NotFound);

            var inputStream = (Stream)new MemoryStream(await IOHelper.ConvertToBytesAsync(Request.Body));
            await storageProvider.WriteAsync(media.Path, inputStream, offset, media.Size);

            return Result.Succeed();
        }

        [HttpGet("load/{mediaId}")]
        public async Task<IActionResult> Load(int mediaId)
        {
            var media = await unitOfWork.Query<Media>().FirstOrDefaultAsync(_ => _.Id == mediaId);
            if (media == null) return Result.Failed(StatusCodes.Status404NotFound);

            var stream = await storageProvider.GetStreamAsync(media.Path);
            return File(stream, media.ContentType, media.Name);
        }
    }
}