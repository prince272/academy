using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.SmsSender;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models.Posts;
using Academy.Server.Services;
using Academy.Server.Utilities;
using AutoMapper;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IMapper mapper;
        private readonly IStorageProvider storageProvider;
        private readonly IDocumentProcessor documentProcessor;
        private readonly ISharedService sharedService;
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly ISmsSender smsSender;
        private readonly IViewRenderer viewRenderer;

        public PostsController(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            documentProcessor = serviceProvider.GetRequiredService<IDocumentProcessor>();
            sharedService = serviceProvider.GetRequiredService<ISharedService>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            smsSender = serviceProvider.GetRequiredService<ISmsSender>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PostEditModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher);
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var post = new Post();
            post.Title = form.Title;
            post.Catgory = form.Catgory;

            var description = await documentProcessor.ProcessHtmlDocumentAsync(form.Description);
            var summary = Sanitizer.StripHtml(description ?? string.Empty);
            post.Description = description;
            post.Summary = summary.Truncate(128, Truncator.FixedLength);

            post.Created = DateTimeOffset.UtcNow;
            post.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (post.Published ?? DateTimeOffset.UtcNow) : null) : post.Published;

            post.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            post.TeacherId = user.Id; // Set the owner of the post.
            post.Code = Compute.GenerateCode("POST");

            await unitOfWork.CreateAsync(post);

            return Result.Succeed(data: post.Id);
        }

        [Authorize]
        [HttpPut("{postId}")]
        public async Task<IActionResult> Edit(int postId, [FromBody] PostEditModel form)
        {
            var post = await unitOfWork.Query<Post>()
                .FirstOrDefaultAsync(_ => _.Id == postId);
            if (post == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && post.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            post.Title = form.Title;
            post.Catgory = form.Catgory;

            var description = await documentProcessor.ProcessHtmlDocumentAsync(form.Description);
            var summary = Sanitizer.StripHtml(description ?? string.Empty);
            post.Description = description;
            post.Summary = summary.Truncate(128, Truncator.FixedLength);

            post.Updated = DateTimeOffset.UtcNow;
            post.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (post.Published ?? DateTimeOffset.UtcNow) : null) : post.Published;

            post.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));

            await unitOfWork.UpdateAsync(post);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{postId}")]
        public async Task<IActionResult> Delete(int postId)
        {
            var post = await unitOfWork.Query<Post>()
                .FirstOrDefaultAsync(_ => _.Id == postId);
            if (post == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && post.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(post);

            return Result.Succeed();
        }
    }
}
