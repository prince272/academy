using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.CacheManager;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Utilities;
using FFMpegCore;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
        private readonly Settings settings;

        public MediasController(IServiceProvider serviceProvider)
        {
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            cacheManager = serviceProvider.GetRequiredService<ICacheManager>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            settings = serviceProvider.GetRequiredService<IOptions<Settings>>().Value;
        }

        [Authorize(Roles = RoleNames.Teacher)]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload()
        {
            var user = await HttpContext.GetCurrentUserAsync();

            var mediaName = Request.Headers["Upload-Name"].ToString();
            var mediaSize = long.Parse(Request.Headers["Upload-Size"]);

            var acceptExtensions = Request.Headers.GetCommaSeparatedValues("Accept-Extensions");

            var mediaRule = settings.Media.Rules.FirstOrDefault(
                _ => _.Extensions.Intersect(acceptExtensions).Contains(Path.GetExtension(mediaName), StringComparer.InvariantCultureIgnoreCase));

            if (mediaRule == null)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "The file type is not supported.");

            if (mediaSize > mediaRule.Size)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "The file size is too large.");

            var mediaType = mediaRule.Type;

            var media = new Media(mediaType, mediaName, mediaSize);
            await unitOfWork.CreateAsync(media);

            return Result.Succeed(media);
        }

        [Authorize(Roles = RoleNames.Teacher)]
        [HttpPatch("upload/{mediaId}")]
        public async Task<IActionResult> Upload(int mediaId)
        {
            var offset = long.Parse(Request.Headers["Upload-Offset"]);

            var mediaCacheKey = $"{nameof(MediasController)}.{nameof(Upload)}-{mediaId}";
            var media = await cacheManager.GetAsync(mediaCacheKey, () => unitOfWork.Query<Media>().FirstOrDefaultAsync(_ => _.Id == mediaId));

            if (media == null) return Result.Failed(StatusCodes.Status404NotFound);

            var inputStream = (Stream)new MemoryStream(await IOHelper.ConvertToBytesAsync(Request.Body));
            var outputStream = await storageProvider.WriteAsync(media.Path, inputStream, offset, media.Size);
            if (outputStream != null)
            {
                try
                {
                    if (media.Type == MediaType.Video || media.Type == MediaType.Audio)
                    {
                        var mediaInfo = await FFProbe.AnalyseAsync(outputStream);
                        media.Duration = mediaInfo.Duration.Ticks;
                        await unitOfWork.UpdateAsync(media);
                    }
                }
                finally
                {
                    await outputStream.DisposeAsync();
                }
            }

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