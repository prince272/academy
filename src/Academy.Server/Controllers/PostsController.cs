﻿using Academy.Server.Data;
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
using AutoMapper.QueryableExtensions;
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
            post.Category = form.Category;

            var descriptionInHTML = await documentProcessor.ProcessHtmlDocumentAsync(form.Description);
            var descriptionInText = Sanitizer.StripHtml(descriptionInHTML ?? string.Empty);
            var duration = Sanitizer.GetTextReadingDuration(descriptionInText);

            post.Description = descriptionInHTML;
            post.Summary = descriptionInText.Truncate(128, Truncator.FixedLength);
            post.Duration = duration;

            post.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            post.TeacherId = user.Id; // Set the owner of the post.
            post.Teacher = user;
            post.Code = Compute.GenerateCode("POST");

            post.Created = DateTimeOffset.UtcNow;
            var prevPublished = post.Published;
            post.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (prevPublished ?? DateTimeOffset.UtcNow) : null) : (DateTimeOffset?)null;

            await unitOfWork.CreateAsync(post);

            await NotifyPublication(post);

            return Result.Succeed(data: post.Id);
        }

        [Authorize]
        [HttpPut("{postId}")]
        public async Task<IActionResult> Edit(int postId, [FromBody] PostEditModel form)
        {
            var post = await unitOfWork.Query<Post>()
                .Include(_ => _.Teacher)
                .FirstOrDefaultAsync(_ => _.Id == postId);
            if (post == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && post.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            post.Title = form.Title;
            post.Category = form.Category;

            var descriptionInHTML = await documentProcessor.ProcessHtmlDocumentAsync(form.Description);
            var descriptionInText = Sanitizer.StripHtml(descriptionInHTML ?? string.Empty);
            var duration = Sanitizer.GetTextReadingDuration(descriptionInText);

            post.Description = descriptionInHTML;
            post.Summary = descriptionInText.Truncate(128, Truncator.FixedLength);
            post.Duration = duration;

            post.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));

            post.Updated = DateTimeOffset.UtcNow;
            var prevPublished = post.Published;
            post.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (prevPublished ?? DateTimeOffset.UtcNow) : null) : (DateTimeOffset?)null;

            await unitOfWork.UpdateAsync(post);

            if ((post.Published != null) != (prevPublished != null))
            {
                if ((post.Published != null) != (prevPublished != null))
                {
                    await NotifyPublication(post);
                }
            }

            return Result.Succeed();
        }

        [NonAction]
        public async Task NotifyPublication(Post post)
        {
            if (post.Published != null)
            {
                if (post.Teacher.Email != null)
                    (emailSender.SendAsync(account: appSettings.Company.Emails.Info, address: new EmailAddress { Email = post.Teacher.Email },
                       subject: "Your Post Has Been Published",
                       body: await viewRenderer.RenderToStringAsync("Email/PostPublished", post))).Forget();

                if (post.Teacher.PhoneNumber != null)
                    (smsSender.SendAsync(post.Teacher.PhoneNumber, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/PostPublished", post)))).Forget();
            }
            else
            {
                if (post.Teacher.Email != null)
                    (emailSender.SendAsync(account: appSettings.Company.Emails.Info, address: new EmailAddress { Email = post.Teacher.Email },
                       subject: "Your Post Is Being Reviewed",
                       body: await viewRenderer.RenderToStringAsync("Email/PostReviewed", post))).Forget();

                if (post.Teacher.PhoneNumber != null)
                    (smsSender.SendAsync(post.Teacher.PhoneNumber, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/PostReviewed", post)))).Forget();
            }
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

        [HttpGet("{postId}")]
        public async Task<IActionResult> Read(int postId)
        {
            var postModel = await GetPostModel(postId);
            if (postModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: postModel);
        }

        [HttpPost("{postId}/react")]
        public async Task<IActionResult> React(int postId, [FromBody] PostReactionTypeModel form)
        {
            var post = await unitOfWork.Query<Post>()
                .FirstOrDefaultAsync(_ => _.Id == postId);
            if (post == null) return Result.Failed(StatusCodes.Status404NotFound);

            var anonymousId = Request.GetAnonymousId();

            var reaction = await unitOfWork.Query<PostReaction>().FirstOrDefaultAsync(_ => _.PostId == post.Id && _.AnonymousId == anonymousId);
            if (reaction == null)
            {
                reaction = new PostReaction();
                reaction.PostId = post.Id;
                reaction.AnonymousId = anonymousId;
                await unitOfWork.CreateAsync(reaction);
            }

            if (form.Type.HasValue)
            {
                reaction.Type = form.Type.Value;
                await unitOfWork.UpdateAsync(reaction);
            }
            else
            {
                await unitOfWork.DeleteAsync(reaction);
            }

            return Result.Succeed();
        }

        [HttpGet]
        public async Task<IActionResult> List(int pageNumber, int pageSize, [FromQuery] PostSearchModel search)
        {
            var query = await GetPostSearchQuery(search);

            var pageInfo = new PageInfo(await query.CountAsync(), pageNumber, pageSize);

            query = (pageInfo.SkipItems > 0 ? query.Skip(pageInfo.SkipItems) : query).Take(pageInfo.PageSize);

            var pageItems = await (await (query.Select(_ => _.Id).ToListAsync())).SelectAsync(async postId =>
            {
                var postModel = await GetPostModel(postId) ?? throw new ArgumentNullException(nameof(postId));
                return postModel;
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [HttpGet("info")]
        public async Task<IActionResult> ListInfo([FromQuery] PostSearchModel search)
        {
            var query = await GetPostSearchQuery(search);

            var posts = await query.Select(post => new
            {
                post.Id,
                post.Created,
                post.Updated,

            }).ToListAsync();

            return Result.Succeed(data: posts);
        }

        [NonAction]
        public async Task<IQueryable<Post>> GetPostSearchQuery([FromQuery] PostSearchModel search)
        {
            var query = unitOfWork.Query<Post>()
            .AsNoTracking();

            var user = await HttpContext.Request.GetCurrentUserAsync();

            if (user != null && user.HasRoles(RoleConstants.Admin)) { }

            else query = user != null && user.HasRoles(RoleConstants.Teacher)
                ? query.Where(_ => _.TeacherId == user.Id) : query.Where(_ => _.Published != null);

            if (search.Sort == PostSort.Trending)
            {

            }

            if (search.Sort == PostSort.Latest)
            {
                query = query.OrderByDescending(_ => _.Created);
            }

            if (search.Sort == PostSort.Recent)
            {
                query = query.OrderByDescending(_ => _.Updated);
            }

            if (search.Category != null)
            {
                query = query.Where(_ => _.Category == search.Category);
            }

            if (!string.IsNullOrWhiteSpace(search.Query))
            {
                var predicates = new List<Expression<Func<Post, bool>>>();

                predicates.Add(_ => EF.Functions.Like(_.Title, $"%{search.Query}%") ||
                                    EF.Functions.Like(_.Category.ToString(), $"%{search.Query}%"));

                query = query.WhereAny(predicates.ToArray());
            }

            return query;
        }

        [NonAction]
        private async Task<PostModel> GetPostModel(int postId, bool single = true)
        {
            var query = unitOfWork.Query<Post>().AsNoTracking()
                .Include(_ => _.Teacher)
                .ProjectTo<Post>(new MapperConfiguration(config =>
                {
                    var map = config.CreateMap<Post, Post>();
                    if (!single) map.ForMember(_ => _.Description, config => config.Ignore());
                }));

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user != null && (user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher));

            if (user != null && user.HasRoles(RoleConstants.Admin)) { }

            else query = user != null && user.HasRoles(RoleConstants.Teacher)
                ? query.Where(_ => _.TeacherId == user.Id) : query.Where(_ => _.Published != null);

            var post = await query.FirstOrDefaultAsync(_ => _.Id == postId);
            if (post == null) return null;

            var anonymousId = Request.GetAnonymousId();

            var reactions = (await Enum.GetValues<PostReactionType>().SelectAsync(async reactionType =>
            {
                var reactionCount = await unitOfWork.Query<PostReaction>().CountAsync(_ => _.PostId == post.Id && _.Type == reactionType && _.AnonymousId != anonymousId);
                return new PostReactionModel { Type = reactionType, Count = reactionCount };
            })).ToArray();

            var postModel = mapper.Map<PostModel>(post);
            postModel.ReactionCount = reactions.Select(_ => _.Count).Sum();
            postModel.ReactionType = (await unitOfWork.Query<PostReaction>().FirstOrDefaultAsync(_ => _.PostId == post.Id && _.AnonymousId == anonymousId))?.Type;
            postModel.Reactions = reactions;
            return postModel;
        }
    }
}