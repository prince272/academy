using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.SmsSender;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Students;
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
    public class CoursesController : ControllerBase
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

        public CoursesController(IServiceProvider serviceProvider)
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
        public async Task<IActionResult> Create([FromBody] CourseEditModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher);
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var course = new Course();
            course.Title = form.Title;
            course.Subject = form.Subject;
            course.Description = form.Description;
            course.Created = DateTimeOffset.UtcNow;

            course.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (course.Published ?? DateTimeOffset.UtcNow) : null) : course.Published;

            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
            course.Price = form.Cost > 0 ? Math.Round((appSettings.Course.Rate * form.Cost) + form.Cost, 2, MidpointRounding.AwayFromZero) : 0;
            course.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            course.CertificateTemplate = (await unitOfWork.FindAsync<Media>(form.CertificateTemplateId));
            course.TeacherId = user.Id; // Set the owner of the course.
            course.Code = Compute.GenerateCode("COUR");
            await unitOfWork.CreateAsync(course);

            return Result.Succeed(data: course.Id);
        }

        [Authorize]
        [HttpPut("{courseId}")]
        public async Task<IActionResult> Edit(int courseId, [FromBody] CourseEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            course.Title = form.Title;
            course.Subject = form.Subject;
            course.Description = form.Description;
            course.Updated = DateTimeOffset.UtcNow;

            course.Published = user.HasRoles(RoleConstants.Admin) ? (form.Published ? (course.Published ?? DateTimeOffset.UtcNow) : null) : course.Published;

            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
            course.Price = form.Cost > 0 ? Math.Round((appSettings.Course.Rate * form.Cost) + form.Cost, 2, MidpointRounding.AwayFromZero) : 0;
            course.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            course.CertificateTemplate = (await unitOfWork.FindAsync<Media>(form.CertificateTemplateId));

            await unitOfWork.UpdateAsync(course);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{courseId}")]
        public async Task<IActionResult> Delete(int courseId)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(course);

            return Result.Succeed();
        }

        [HttpGet("{courseId}")]
        public async Task<IActionResult> Read(int courseId, int? sectionId = null, int? lessonId = null)
        {
            var courseModel = await GetCourseModel(courseId, sectionId, lessonId);
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: courseModel);
        }

        [HttpGet("/courses")]
        public async Task<IActionResult> List(int pageNumber, int pageSize, [FromQuery] CourseSearchModel search)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user != null && (user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher));

            var query = unitOfWork.Query<Course>();

            if (search.Sort == CourseSort.Popular)
            {
                query = query.OrderByDescending(_ => _.Progresses.Count());
            }

            if (search.Sort == CourseSort.Newest)
            {
                query = query.OrderByDescending(_ => _.Created);
            }

            if (search.Sort == CourseSort.Updated)
            {
                query = query.OrderByDescending(_ => _.Updated);
            }

            if (!permitted)
            {
                query = query.Where(course => course.Published != null);
            }

            if (search.UserId != null)
            {
                query = query.Where(_ => _.Id == search.UserId);
            }

            if (search.Subject != null)
            {
                query = query.Where(_ => _.Subject == search.Subject);
            }

            if (!string.IsNullOrWhiteSpace(search.Query))
            {
                var predicates = new List<Expression<Func<Course, bool>>>();

                predicates.Add(_ => EF.Functions.Like(_.Title, $"%{search.Query}%") ||
                                    EF.Functions.Like(_.Subject.ToString(), $"%{search.Query}%"));

                query = query.WhereAny(predicates.ToArray());
            }


            var pageInfo = new PageInfo(await query.CountAsync(), pageNumber, pageSize);

            query = (pageInfo.SkipItems > 0 ? query.Skip(pageInfo.SkipItems) : query).Take(pageInfo.PageSize);

            var pageItems = await (await (query.Select(_ => _.Id).ToListAsync())).SelectAsync(async courseId =>
            {
                var courseModel = await GetCourseModel(courseId);
                if (courseModel == null) throw new ArgumentException();
                courseModel.Sections = null;
                return courseModel;
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [Authorize]
        [HttpPost("{courseId}/purchase")]
        public async Task<IActionResult> Purchase(int courseId)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            var payment = new Payment();
            payment.Reason = PaymentReason.Course;
            payment.Status = PaymentStatus.Pending;
            payment.Type = PaymentType.Payin;
            payment.Title = $"Purchase {course.Title}";
            payment.ReferenceId = course.Code;
            payment.Amount = course.Price;
            payment.IPAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.UserId = user.Id;
            payment.PhoneNumber = user.PhoneNumber;
            payment.Email = user.Email;
            payment.FullName = user.FullName;

            await unitOfWork.CreateAsync(payment);
            return Result.Succeed(data: new
            {
                payment.Id,
                payment.Title,
                payment.Amount,
                payment.Status
            });
        }

        [Authorize]
        [HttpPost("{courseId}/sections/{sectionId}/lessons/{lessonId}/contents/{contentId}/progress")]
        public async Task<IActionResult> Progresss(int courseId, int sectionId, int lessonId, int contentId, [FromBody] ContentProgressModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            var progress = user.CourseProgresses.FirstOrDefault(_ => _.CourseId == courseId && _.SectionId == sectionId && _.LessonId == lessonId && _.ContentId == contentId);
            if (progress == null)
            {
                progress = new CourseProgress()
                {
                    UserId = user.Id,
                    CourseId = courseId,
                    SectionId = sectionId,
                    LessonId = lessonId,
                    ContentId = contentId,
                    Status = CourseStatus.Completed,
                    Checks = form.Inputs
                };

                await unitOfWork.CreateAsync(progress);
            }

            var courseModel = await GetCourseModel(courseId);
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            if (courseModel.Price > 0 && !courseModel.Purchased)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, message: "Payment is required to take this course.");
            }

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lessonModel = sectionModel.Lessons.FirstOrDefault(_ => _.Id == lessonId);
            if (lessonModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var contentModel = lessonModel.Contents.FirstOrDefault(_ => _.Id == contentId);
            if (contentModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            if (contentModel.Status == CourseStatus.Completed && (progress.Completed == null))
            {
                if (contentModel.Type == ContentType.Explanation)
                {
                    user.Bits += appSettings.Course.BitRules[CourseBitRuleType.CompleteLesson].Value;
                }
                else if (contentModel.Type == ContentType.Question)
                {
                    if (form.Solve)
                    {
                        var remainingBits = user.Bits + appSettings.Course.BitRules[CourseBitRuleType.SeekAnswer].Value;

                        if (remainingBits < 0)
                        {
                            return Result.Failed(StatusCodes.Status400BadRequest, $"You need {"bit".ToQuantity(Math.Abs(appSettings.Course.BitRules[CourseBitRuleType.SeekAnswer].Value))} to show the answer.");
                        }

                        user.Bits = remainingBits;
                    }
                    else
                    {
                        user.Bits += contentModel.Correct.Value ?
                            appSettings.Course.BitRules[CourseBitRuleType.AnswerCorrectly].Value :
                            appSettings.Course.BitRules[CourseBitRuleType.AnswerWrongly].Value;
                    }
                }

                progress.Completed = DateTimeOffset.UtcNow;
                await unitOfWork.UpdateAsync(progress);
            }

            return Result.Succeed(new { user.Bits, progress = courseModel.Progress });
        }

        [Authorize]
        [HttpPost("{courseId}/certificate")]
        public async Task<IActionResult> Certificate(int courseId)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            var courseModel = await GetCourseModel(courseId);

            if (courseModel == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            if (courseModel.Status != CourseStatus.Completed)
                return Result.Failed(StatusCodes.Status400BadRequest);

            if (courseModel.Course.CertificateTemplate == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var created = false;
            var certificate = user.Certificates.FirstOrDefault(_ => _.CourseId == courseModel.Id);
            if (certificate == null)
            {
                user.Certificates.Add(certificate = new Certificate
                {
                    UserId = user.Id,
                    CourseId = courseModel.Id,
                    Number = Compute.GenerateCode("CERT")
                });
                await unitOfWork.CreateAsync(certificate);
                created = true;
            }

            var certificateFields = new Dictionary<string, object>();
            certificateFields.Add("UserFullName", user.FullName);
            certificateFields.Add("CourseTitle", courseModel.Title);
            certificateFields.Add("CourseStarted", courseModel.Started);
            certificateFields.Add("CourseCompleted", courseModel.Completed);
            certificateFields.Add("CertificateNumber", certificate.Number);

            using var certificateTemplateStream = await storageProvider.GetStreamAsync(courseModel.Course.CertificateTemplate.Path);
            using var certificateMergedStream = new MemoryStream();
            await documentProcessor.MergeWordDocumentAsync(certificateTemplateStream, certificateMergedStream, certificateFields);

            async Task<Media> CreateMedia(MediaType mediaType, DocumentFormat format)
            {
                using var certificateStream = new MemoryStream();
                await documentProcessor.ConvertWordDocumentAsync(certificateMergedStream, certificateStream, format);

                var mediaName = $"{courseModel.Title} Certificate.{format.ToString().ToLowerInvariant()}";
                var mediaPath = MediaConstants.GetPath("certificates", mediaType, mediaName);

                var media = new Media
                {
                    Name = mediaName,
                    Type = mediaType,
                    Path = mediaPath,
                    ContentType = MimeTypeMap.GetMimeType(mediaName),
                    Size = certificateStream.Length
                };
                await storageProvider.WriteAsync(mediaPath, certificateStream);
                return media;
            }

            certificate.Document = (await CreateMedia(MediaType.Document, DocumentFormat.Pdf));
            certificate.Image = (await CreateMedia(MediaType.Image, DocumentFormat.Jpg));
            await unitOfWork.UpdateAsync(certificate);

            courseModel.Certificate = mapper.Map<CertificateModel>(certificate);

            if (created)
            {
                if (user.Email != null)
                {
                    emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = user.Email },
                       subject: $"Congratulations! You've completed the {courseModel.Title} course!",
                       body: await viewRenderer.RenderToStringAsync("Email/CourseCertification", (user, courseModel))).Forget();
                }

                if  (user.PhoneNumber != null)
                {
                    smsSender.SendAsync(user.PhoneNumber, await viewRenderer.RenderToStringAsync("Sms/CourseCertification", (user, courseModel))).Forget();
                }
            }

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("{courseId}/reorder")]
        public async Task<IActionResult> Reorder(int courseId, [FromBody] CourseReorderModel form)
        {
            var course = (await GetCourseModel(courseId))?.Course;

            if (course == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher);
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var source = form.Source;
            var destination = form.Destination;

            if (source == null || destination == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            if (source.Id == destination.Id &&
                source.Index == destination.Index)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var sections = course.Sections.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();

            if (form.Type == CourseReorderType.Section)
            {
                sections.Move(source.Index, destination.Index);
                sections.ForEach((section, sectionIndex) =>
                {
                    unitOfWork.Context.Attach(section);

                    section.Index = sectionIndex;
                });

                await unitOfWork.Context.SaveChangesAsync();
            }
            else if (form.Type == CourseReorderType.Lesson)
            {
                var sourceSection = sections.First(section => section.Id == source.Id);
                var destinationSection = sections.First(section => section.Id == destination.Id);

                var sourceLessons = sourceSection.Lessons.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();
                var destinationLessons = destinationSection.Lessons.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();

                if (sourceSection == destinationSection)
                {
                    sourceLessons.Move(source.Index, destination.Index);

                    sourceLessons.ForEach((lesson, lessonIndex) =>
                    {
                        unitOfWork.Context.Attach(lesson);

                        lesson.Index = lessonIndex;
                    });

                    await unitOfWork.Context.SaveChangesAsync();
                }
                else
                {
                    sourceLessons.Transfer(source.Index, destination.Index, destinationLessons);

                    sourceLessons.ForEach((lesson, lessonIndex) =>
                    {
                        unitOfWork.Context.Attach(lesson);

                        lesson.SectionId = sourceSection.Id;
                        lesson.Index = lessonIndex;
                    });

                    destinationLessons.ForEach((lesson, lessonIndex) =>
                    {
                        unitOfWork.Context.Attach(lesson);

                        lesson.SectionId = destinationSection.Id;
                        lesson.Index = lessonIndex;
                    });

                    await unitOfWork.Context.SaveChangesAsync();
                }
            }
            else if (form.Type == CourseReorderType.Content)
            {
                var sourceLesson = sections.SelectMany(_ => _.Lessons).First(lesson => lesson.Id == source.Id);
                var destinationLesson = sections.SelectMany(_ => _.Lessons).First(lesson => lesson.Id == destination.Id);

                var sourceContents = sourceLesson.Contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();
                var destinationContents = destinationLesson.Contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();

                if (sourceLesson == destinationLesson)
                {
                    sourceContents.Move(source.Index, destination.Index);

                    sourceContents.ForEach((content, contentIndex) =>
                    {
                        unitOfWork.Context.Attach(content);

                        content.Index = contentIndex;
                    });

                    await unitOfWork.Context.SaveChangesAsync();
                }
                else
                {
                    sourceContents.Transfer(source.Index, destination.Index, destinationContents);

                    sourceContents.ForEach((content, contentIndex) =>
                    {
                        unitOfWork.Context.Attach(content);

                        content.LessonId = sourceLesson.Id;
                        content.Index = contentIndex;
                    });
                    destinationContents.ForEach((content, contentIndex) =>
                    {
                        unitOfWork.Context.Attach(content);

                        content.LessonId = destinationLesson.Id;
                        content.Index = contentIndex;
                    });

                    await unitOfWork.Context.SaveChangesAsync();
                }
            }
            else
            {
                throw new NotImplementedException();
            }

            return Result.Succeed();
        }


        [Authorize]
        [HttpPost("{courseId}/reviews")]
        public async Task<IActionResult> Create(int courseId, [FromBody] ReviewEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            var review = new Review();
            review.CourseId = course.Id; // Set the owner of the review.
            review.UserId = user.Id;
            review.Message = form.Message;
            review.Rating = form.Rating;
            review.Created = DateTimeOffset.UtcNow;
            review.Approved = true;

            await unitOfWork.CreateAsync(review);

            return Result.Succeed(data: review.Id);
        }

        [HttpGet("{courseId}/students")]
        public async Task<IActionResult> Students(int courseId, int pageNumber, int pageSize, [FromQuery] StudentSearchModel search)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var query = unitOfWork.Query<User>();
            query = query.Where(_ => _.Id == course.TeacherId);

            var pageInfo = new PageInfo(await query.CountAsync(), pageNumber, pageSize);

            query = (pageInfo.SkipItems > 0 ? query.Skip(pageInfo.SkipItems) : query).Take(pageInfo.PageSize);

            var pageItems = await (await (query.Select(_ => _.Id).ToListAsync())).SelectAsync(async userId =>
            {
                var user = await query.FirstOrDefaultAsync(_ => _.Id == userId);
                if (user == null) throw new ArgumentException();
                return mapper.Map<StudentSearchModel>(user);
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [Authorize]
        [HttpPut("{courseId}/reviews/{reviewId}")]
        public async Task<IActionResult> Edit(int courseId, int reviewId, [FromBody] ReviewEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var review = await unitOfWork.Query<Review>()
                .FirstOrDefaultAsync(_ => _.Id == reviewId);
            if (review == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            review.Message = form.Message;
            review.Rating = form.Rating;
            review.Updated = DateTimeOffset.UtcNow;

            await unitOfWork.UpdateAsync(review);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{courseId}/reviews/{reviewId}")]
        public async Task<IActionResult> DeleteReview(int courseId, int reviewId)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var review = await unitOfWork.Query<Review>()
                .FirstOrDefaultAsync(_ => _.Id == reviewId);
            if (review == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            await unitOfWork.DeleteAsync(review);

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("{courseId}/sections")]
        public async Task<IActionResult> Create(int courseId, [FromBody] SectionEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var section = new Section();
            section.Index = -1;
            section.CourseId = course.Id; // Set the owner of the section.
            section.Title = form.Title;

            await unitOfWork.CreateAsync(section);

            return Result.Succeed(data: section.Id);
        }

        [Authorize]
        [HttpPut("{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, [FromBody] SectionEditModel form)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            section.Title = form.Title;

            await unitOfWork.UpdateAsync(section);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(section);

            return Result.Succeed();
        }

        [HttpGet("{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId)
        {
            var courseModel = (await GetCourseModel(courseId));
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: sectionModel);
        }


        [Authorize]
        [HttpPost("{courseId}/sections/{sectionId}/lessons")]
        public async Task<IActionResult> Create(int courseId, int sectionId, [FromBody] LessonEditModel form)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var lesson = new Lesson();
            lesson.Index = -1;
            lesson.SectionId = section.Id;  // Set the owner of the lesson.
            lesson.Title = form.Title;

            await unitOfWork.CreateAsync(lesson);

            return Result.Succeed(data: lesson.Id);
        }

        [Authorize]
        [HttpPut("{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, int lessonId, [FromBody] LessonEditModel form)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            lesson.Title = form.Title;

            await unitOfWork.UpdateAsync(lesson);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId, int lessonId)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(lesson);

            return Result.Succeed();
        }

        [Authorize]
        [HttpGet("{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId, int lessonId)
        {
            var courseModel = (await GetCourseModel(courseId));
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lessonModel = sectionModel.Lessons.FirstOrDefault(_ => _.Id == lessonId);
            if (lessonModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: lessonModel);
        }

        [Authorize]
        [HttpPost("{courseId}/sections/{sectionId}/lessons/{lessonId}/contents")]
        public async Task<IActionResult> Create(int courseId, int sectionId, int lessonId, [FromBody] ContentEditModel form)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var content = new Content();
            content.Index = -1;
            content.LessonId = lesson.Id; // Set the owner of the content.
            content.Type = form.Type;

            if (form.Type == ContentType.Explanation)
            {
                var explanation = await documentProcessor.ProcessHtmlDocumentAsync(form.Explanation);
                var summary = Sanitizer.StripHtml(explanation ?? string.Empty);
                content.Explanation = explanation;
                content.Summary = summary.Truncate(128, Truncator.FixedLength);
                content.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));
                content.ExternalMediaUrl = form.ExternalMediaUrl;

                var duration = 0L;
                duration += Sanitizer.GetTextReadingDuration(summary);
                content.Duration = duration;

                // Clear old props.
                content.Question = null;
                content.AnswerType = null;
                content.Answers = null;
                content.Checks = null;
            }
            else if (form.Type == ContentType.Question)
            {
                var question = await documentProcessor.ProcessHtmlDocumentAsync(form.Question);
                var summary = Sanitizer.StripHtml(question ?? string.Empty);

                content.Question = form.Question;
                content.Summary = summary.Truncate(128, Truncator.FixedLength);
                content.AnswerType = form.AnswerType ?? default(AnswerType);
                content.Answers = (form.Answers ?? Array.Empty<ContentAnswerEditModel>()).Select(formAnswer => new ContentAnswer
                {
                    Id = formAnswer.Id,
                    Text = formAnswer.Text,
                    Checked = formAnswer.Checked,
                }).ToArray();
                content.Checks = (form.Answers ?? Array.Empty<ContentAnswerEditModel>()).Where(_ => _.Checked).Select(_ => _.Id.ToString()).ToArray();

                var duration = 0L;
                duration += Sanitizer.GetTextReadingDuration(summary);
                duration += content.Answers.Select(answer => Sanitizer.GetTextReadingDuration(answer.Text ?? string.Empty)).Sum();
                content.Duration = duration;

                // Clear old props.
                content.Explanation = null;
                content.Media = null;
                content.ExternalMediaUrl = null;
            }

            await unitOfWork.CreateAsync(content);

            return Result.Succeed(data: content.Id);
        }

        [Authorize]
        [HttpPut("{courseId}/sections/{sectionId}/lessons/{lessonId}/contents/{contentId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, int lessonId, int contentId, [FromBody] ContentEditModel form)
        {
            var content = await unitOfWork.Query<Content>().AsSingleQuery()
                .Include(_ => _.Lesson).ThenInclude(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == contentId);
            if (content == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lesson = content.LessonId == lessonId ? content.Lesson : null;
            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = content.Lesson.SectionId == sectionId ? content.Lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = content.Lesson.Section.CourseId == courseId ? content.Lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            content.Type = form.Type;

            if (form.Type == ContentType.Explanation)
            {
                var explanationInHTML = await documentProcessor.ProcessHtmlDocumentAsync(form.Explanation);
                var explanationInText = Sanitizer.StripHtml(explanationInHTML ?? string.Empty);
                var duration = Sanitizer.GetTextReadingDuration(explanationInText);

                content.Explanation = explanationInHTML;
                content.Summary = explanationInText.Truncate(128, Truncator.FixedLength);
                content.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));
                content.ExternalMediaUrl = form.ExternalMediaUrl;

                content.Duration = duration;

                // Clear old props.
                content.Question = null;
                content.AnswerType = null;
                content.Answers = null;
                content.Checks = null;
            }
            else if (form.Type == ContentType.Question)
            {
                var questionInHTML = await documentProcessor.ProcessHtmlDocumentAsync(form.Question);
                var questionInText = Sanitizer.StripHtml(questionInHTML ?? string.Empty);
                var duration = Sanitizer.GetTextReadingDuration(questionInText);

                content.Question = questionInHTML;
                content.Summary = questionInText.Truncate(128, Truncator.FixedLength);
                content.AnswerType = form.AnswerType ?? default(AnswerType);
                content.Answers = (form.Answers ?? Array.Empty<ContentAnswerEditModel>()).Select(formAnswer => new ContentAnswer
                {
                    Id = formAnswer.Id,
                    Text = formAnswer.Text,
                    Checked = formAnswer.Checked,
                }).ToArray();
                content.Checks = (form.Answers ?? Array.Empty<ContentAnswerEditModel>()).Where(_ => _.Checked).Select(_ => _.Id.ToString()).ToArray();

                duration += content.Answers.Select(answer => Sanitizer.GetTextReadingDuration(answer.Text ?? string.Empty)).Sum();
                content.Duration = duration;

                // Clear old props.
                content.Explanation = null;
                content.Media = null;
                content.ExternalMediaUrl = null;
            }

            await unitOfWork.UpdateAsync(content);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("{courseId}/sections/{sectionId}/lessons/{lessonId}/contents/{contentId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId, int lessonId, int contentId)
        {
            var content = await unitOfWork.Query<Content>().AsSingleQuery()
                .Include(_ => _.Lesson).ThenInclude(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == contentId);
            if (content == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lesson = content.LessonId == lessonId ? content.Lesson : null;
            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = content.Lesson.SectionId == sectionId ? content.Lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = content.Lesson.Section.CourseId == courseId ? content.Lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.TeacherId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(content);

            return Result.Succeed();
        }

        [Authorize]
        [HttpGet("{courseId}/sections/{sectionId}/lessons/{lessonId}/contents/{contentId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId, int lessonId, int contentId)
        {
            var courseModel = (await GetCourseModel(courseId, sectionId, lessonId));
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lessonModel = sectionModel.Lessons.FirstOrDefault(_ => _.Id == lessonId);
            if (lessonModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var contentModel = lessonModel.Contents.FirstOrDefault(_ => _.Id == contentId);
            if (contentModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: contentModel);
        }
        
        [NonAction]
        private async Task<CourseModel> GetCourseModel(int courseId, int? sectionId = null, int? lessonId = null, bool single = true)
        {
            var course = await unitOfWork.Query<Course>()
                .AsNoTracking()
                .Include(_ => _.Teacher)
                .FirstOrDefaultAsync(_ => _.Id == courseId);

            if (course == null) return null;

            var ids = new int[] { course.Id };

            var sections = await unitOfWork.Query<Section>()
                .AsNoTracking()
                .Where(_ => ids.Contains(_.CourseId))
                .ToListAsync(); ids = sections.Select(_ => _.Id).ToArray();

            var lessons = await unitOfWork.Query<Lesson>()
                .AsNoTracking()
                .Where(_ => ids.Contains(_.SectionId))
                .ToListAsync(); ids = lessons.Select(_ => _.Id).ToArray();

            var contents = await unitOfWork.Query<Content>()
                .AsTracking()
                .Where(_ => ids.Contains(_.LessonId) && _.LessonId == lessonId)
                .ToListAsync();

            contents.AddRange(await unitOfWork.Query<Content>()
                .AsTracking()
                .Where(_ => ids.Contains(_.LessonId) && _.LessonId != lessonId)
                .Select(content => new Content
                {
                    LessonId = content.LessonId,
                    Index = content.Index,
                    Id = content.Id,
                    Summary = content.Summary,
                    Type = content.Type,
                    Duration = content.Duration,
                    AnswerType = content.AnswerType,
                    Checks = content.Checks
                })
                .ToListAsync());

            var duration = Sanitizer.GetTextReadingDuration(course.Title ?? string.Empty);
            var progresses = new List<CourseProgress>();

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user != null && (user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher));

            course.Sections = sections.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).Where(_ => _.CourseId == course.Id).Select(section =>
            {
                duration += Sanitizer.GetTextReadingDuration(section.Title ?? string.Empty);

                section.Lessons = lessons.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).Where(_ => _.SectionId == section.Id).Select(lesson =>
                {
                    duration += Sanitizer.GetTextReadingDuration(lesson.Title ?? string.Empty);

                    lesson.Contents = contents.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).Where(_ => _.LessonId == lesson.Id).Select(content => content).ToList();

                    lesson.Contents.ForEach(content =>
                    {
                        duration += content.Duration;

                        var progress = user?.CourseProgresses.FirstOrDefault(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id && _.ContentId == content.Id);
                        progress ??= new CourseProgress { CourseId = course.Id, SectionId = section.Id, LessonId = lesson.Id, ContentId = content.Id, Status = CourseStatus.Locked };
                        progresses.Add(progress);
                    });

                    return lesson;
                }).ToList();

                return section;
            }).ToList();

            CourseStatus GetStatus(CourseStatus[] statuses)
            {
                return statuses.Any(status => status == CourseStatus.Started) ? CourseStatus.Started :
                  statuses.All(status => status == CourseStatus.Completed) &&
                  statuses.Any() ? CourseStatus.Completed : CourseStatus.Locked;
            }

            decimal GetProgress(CourseStatus[] statuses)
            {
                var complete = statuses.Count(status => status == CourseStatus.Completed);
                return (Math.Round(complete / (decimal)Math.Max(statuses.Count(), 1), 2, MidpointRounding.ToZero));
            };

            var progress = progresses.FirstOrDefault(_ => _.Status == CourseStatus.Locked);
            if (progress != null) progress.Status = CourseStatus.Started;

            var courseCertificate = user?.Certificates.FirstOrDefault(_ => _.CourseId == course.Id);
            var coursePurchased = user != null ? await unitOfWork.Query<Payment>()
                .AsNoTracking()
                .AnyAsync(_ => _.UserId == user.Id &&
                               _.Reason == PaymentReason.Course &&
                               _.ReferenceId == course.Code &&
                               _.Status == PaymentStatus.Complete) : false;

            var courseStudents = await unitOfWork.Query<User>()
                .AsNoTracking()
                .CountAsync(_ => _.CourseProgresses.Any(progress => progress.CourseId == course.Id));

            var courseModel = mapper.Map<CourseModel>(course);
            courseModel.Course = course;
            courseModel.Cost = permitted ? course.Cost : null;
            courseModel.Certificate = mapper.Map<CertificateModel>(courseCertificate);
            courseModel.Purchased = coursePurchased;
            courseModel.Students = courseStudents;
            courseModel.Sections = course.Sections.Select(section =>
            {
                var sectionModel = mapper.Map<SectionModel>(section);
                sectionModel.Lessons = section.Lessons.Select(lesson =>
                {
                    var lessonModel = mapper.Map<LessonModel>(lesson);
                    lessonModel.Contents = lesson.Contents.Select(content =>
                    {
                        var progress = progresses.First(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id && _.ContentId == content.Id);

                        var contentModel = mapper.Map<ContentModel>(content);

                        if (content.Type == ContentType.Question)
                        {
                            contentModel.Answers = permitted ? content.Answers : Protection.Encrypt(appSettings.Company.Name, JsonConvert.SerializeObject(content.Answers, JsonSerializerSettingsDefaults.Web));
                            contentModel.Correct = progress.Status == CourseStatus.Completed ? ((Func<bool>)(() =>
                            {
                                if (content.AnswerType == AnswerType.SelectSingle || content.AnswerType == AnswerType.SelectMultiple)
                                    return content.Checks.OrderBy(_ => _).SequenceEqual((progress.Checks ?? Array.Empty<string>()).OrderBy(_ => _));

                                else if (content.AnswerType == AnswerType.Reorder)
                                    return content.Checks.SequenceEqual(progress.Checks ?? Array.Empty<string>());

                                else return false;
                            }))() : null;
                        }
                        else if (content.Type == ContentType.Explanation)
                        {
                        }

                        contentModel.Status = progress.Status;
                        return contentModel;
                    }).ToArray();
                    lessonModel.Status = GetStatus(progresses.Where(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id).Select(_ => _.Status).ToArray());
                    return lessonModel;
                }).ToArray();

                var statuses = progresses.Where(_ => _.CourseId == course.Id && _.SectionId == section.Id).Select(_ => _.Status).ToArray();
                sectionModel.Status = GetStatus(statuses);
                sectionModel.Progress = GetProgress(statuses);

                return sectionModel;

            }).ToArray();
            courseModel.Duration = duration;
            courseModel.Started = progresses.Where(_ => _.CourseId == course.Id).OrderBy(_ => _.Completed).FirstOrDefault()?.Completed;
            courseModel.Completed = progresses.Where(_ => _.CourseId == course.Id).OrderByDescending(_ => _.Completed).FirstOrDefault()?.Completed;

            var statuses = progresses.Where(_ => _.CourseId == course.Id).Select(_ => _.Status).ToArray();
            courseModel.Status = GetStatus(statuses);
            courseModel.Progress = GetProgress(statuses);

            return courseModel;
        }
    }
}