using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
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
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IMapper mapper;
        private readonly IStorageProvider storageProvider;
        private readonly IDocumentProcessor documentProcessor;
        private readonly ISharedService sharedService;
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
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
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }

        [Authorize]
        [HttpPost("/courses")]
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
           
            course.State = course.State == CourseState.Rejected ? (user.HasRoles(RoleConstants.Admin) ? form.State : course.State) : form.State;
            course.Published = course.State == CourseState.Visible ? course.Published ?? DateTimeOffset.UtcNow : null;

            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
            course.Price = form.Cost > 0 ? Math.Round((appSettings.Course.Rate * form.Cost) + form.Cost, 2, MidpointRounding.AwayFromZero) : 0;
            course.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            course.CertificateTemplate = (await unitOfWork.FindAsync<Media>(form.CertificateTemplateId));
            course.UserId = user.Id; // Set the owner of the course.
            course.Code = Compute.GenerateCode("COUR");
            await unitOfWork.CreateAsync(course);

            return Result.Succeed(data: course.Id);
        }

        [Authorize]
        [HttpPut("/courses/{courseId}")]
        public async Task<IActionResult> Edit(int courseId, [FromBody] CourseEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            course.Title = form.Title;
            course.Subject = form.Subject;
            course.Description = form.Description;
            course.Updated = DateTimeOffset.UtcNow;

            course.State = course.State == CourseState.Rejected ? (user.HasRoles(RoleConstants.Admin) ? form.State : course.State) : form.State;
            course.Published = course.State == CourseState.Visible ? course.Published ?? DateTimeOffset.UtcNow : null;

            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
            course.Price = form.Cost > 0 ? Math.Round((appSettings.Course.Rate * form.Cost) + form.Cost, 2, MidpointRounding.AwayFromZero) : 0;
            course.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            course.CertificateTemplate = (await unitOfWork.FindAsync<Media>(form.CertificateTemplateId));

            await unitOfWork.UpdateAsync(course);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("/courses/{courseId}")]
        public async Task<IActionResult> Delete(int courseId)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(course);

            return Result.Succeed();
        }

        [HttpGet("/courses/{courseId}")]
        public async Task<IActionResult> Read(int courseId)
        {
            var courseModel = await GetCourseModel(courseId);
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: courseModel);
        }

        [HttpGet("/courses")]
        public async Task<IActionResult> List(int pageNumber, int pageSize, [FromQuery] CourseSearchModel search)
        {
            var query = unitOfWork.Query<Course>();

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user != null && (user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher));

            if (!permitted)
            {
                query = query.Where(course => course.State == CourseState.Visible);
            }

            if (search.UserId != null) query = query.Where(_ => _.Id == search.UserId);

            if (search.Subject != null) query = query.Where(_ => _.Subject == search.Subject);


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
                var courseModel = await GetCourseModel(courseId, true);
                if (courseModel == null) throw new ArgumentException();
                courseModel.Sections = null;
                return courseModel;
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/purchase")]
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
        [HttpPost("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/progress")]
        public async Task<IActionResult> Progresss(int courseId, int sectionId, int lessonId, [FromBody] QuestionProgressModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            var progress = user.CourseProgresses.FirstOrDefault(_ => _.CourseId == courseId && _.SectionId == sectionId && _.LessonId == lessonId && _.QuestionId == form.Id);
            if (progress == null)
            {
                progress = new CourseProgress()
                {
                    UserId = user.Id,
                    CourseId = courseId,
                    SectionId = sectionId,
                    LessonId = lessonId,
                    QuestionId = form.Id,
                    Status = CourseStatus.Completed,
                    Inputs = form.Inputs
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

            if (lessonModel.Status == CourseStatus.Completed && (progress.QuestionId == null && progress.Completed == null))
            {
                user.Bits += appSettings.Course.BitRules[CourseBitRuleType.CompleteLesson].Value;
                progress.Completed = DateTimeOffset.UtcNow;
                    await unitOfWork.UpdateAsync(progress);
            }

            if (form.Id != null)
            {
                var questionModel = lessonModel.Questions.FirstOrDefault(_ => _.Id == form.Id);
                if (questionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

                if (questionModel.Status == CourseStatus.Completed && (progress.QuestionId != null && progress.Completed == null))
                {
                    user.Bits += questionModel.Correct.Value ? 
                        appSettings.Course.BitRules[CourseBitRuleType.AnswerCorrectly].Value :
                        appSettings.Course.BitRules[CourseBitRuleType.AnswerWrongly].Value;

                    progress.Completed = DateTimeOffset.UtcNow;
                    await unitOfWork.UpdateAsync(progress);
                }
            }

            await unitOfWork.UpdateAsync(user);
            return Result.Succeed(new { user.Bits });
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/certificate")]
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
            }

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/reorder")]
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
            else if (form.Type == CourseReorderType.Question)
            {
                var sourceLesson = sections.SelectMany(_ => _.Lessons).First(lesson => lesson.Id == source.Id);
                var destinationLesson = sections.SelectMany(_ => _.Lessons).First(lesson => lesson.Id == destination.Id);

                var sourceQuestions = sourceLesson.Questions.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();
                var destinationQuestions = destinationLesson.Questions.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();

                if (sourceLesson == destinationLesson)
                {
                    sourceQuestions.Move(source.Index, destination.Index);

                    sourceQuestions.ForEach((question, questionIndex) =>
                    {
                        unitOfWork.Context.Attach(question);

                        question.Index = questionIndex;
                    });

                    await unitOfWork.Context.SaveChangesAsync();
                }
                else
                {
                    sourceQuestions.Transfer(source.Index, destination.Index, destinationQuestions);

                    sourceQuestions.ForEach((question, questionIndex) =>
                    {
                        unitOfWork.Context.Attach(question);

                        question.LessonId = sourceLesson.Id;
                        question.Index = questionIndex;
                    });
                    destinationQuestions.ForEach((question, questionIndex) =>
                    {
                        unitOfWork.Context.Attach(question);

                        question.LessonId = destinationLesson.Id;
                        question.Index = questionIndex;
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
        [HttpPost("/courses/{courseId}/reviews")]
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

        [HttpGet("/courses/{courseId}/students")]
        public async Task<IActionResult> Students(int courseId, int pageNumber, int pageSize, [FromQuery] StudentSearchModel search)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var query = unitOfWork.Query<User>();
            query = query.Where(_ => _.Id == course.UserId);

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
        [HttpPut("/courses/{courseId}/reviews/{reviewId}")]
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
        [HttpDelete("/courses/{courseId}/reviews/{reviewId}")]
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
        [HttpPost("/courses/{courseId}/sections")]
        public async Task<IActionResult> Create(int courseId, [FromBody] SectionEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var section = new Section();
            section.Index = -1;
            section.CourseId = course.Id; // Set the owner of the section.
            section.Title = form.Title;

            await unitOfWork.CreateAsync(section);

            return Result.Succeed(data: section.Id);
        }

        [Authorize]
        [HttpPut("/courses/{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, [FromBody] SectionEditModel form)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            section.Title = form.Title;

            await unitOfWork.UpdateAsync(section);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("/courses/{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(section);

            return Result.Succeed();
        }

        [HttpGet("/courses/{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId)
        {
            var courseModel = (await GetCourseModel(courseId));
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: sectionModel);
        }


        [Authorize]
        [HttpPost("/courses/{courseId}/sections/{sectionId}/lessons")]
        public async Task<IActionResult> Create(int courseId, int sectionId, [FromBody] LessonEditModel form)
        {
            var section = await unitOfWork.Query<Section>().AsSingleQuery()
                .Include(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == sectionId);
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = section.CourseId == courseId ? section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var lesson = new Lesson();
            lesson.Index = -1;
            lesson.SectionId = section.Id;  // Set the owner of the lesson.
            lesson.Title = form.Title;
            lesson.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));

            await sharedService.WriteDocmentAsync(lesson, form.Document);
            sharedService.CalculateDuration(lesson);
            await unitOfWork.CreateAsync(lesson);

            return Result.Succeed(data: lesson.Id);
        }

        [Authorize]
        [HttpPut("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, int lessonId, [FromBody] LessonEditModel form)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Questions.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .ThenInclude(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            lesson.Title = form.Title;
            lesson.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));
            lesson.ExternalMediaUrl = form.ExternalMediaUrl;

            await sharedService.WriteDocmentAsync(lesson, form.Document);
            sharedService.CalculateDuration(lesson);

            await unitOfWork.UpdateAsync(lesson);

            return Result.Succeed();
        }

        [Authorize]
        [HttpDelete("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId, int lessonId)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Questions.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .ThenInclude(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(lesson);

            return Result.Succeed();
        }

        [Authorize]
        [HttpGet("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}")]
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
        [HttpPost("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions")]
        public async Task<IActionResult> Create(int courseId, int sectionId, int lessonId, [FromBody] QuestionEditModel form)
        {
            var lesson = await unitOfWork.Query<Lesson>().AsSingleQuery()
                .Include(_ => _.Questions.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .ThenInclude(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == lessonId);

            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = lesson.SectionId == sectionId ? lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = lesson.Section.CourseId == courseId ? lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            var question = new Question();
            question.Index = -1;
            question.LessonId = lesson.Id; // Set the owner of the question.
            question.Text = form.Text;
            question.AnswerType = form.AnswerType;

            await unitOfWork.CreateAsync(question);
            await UpdateAnswers(question, form);

            // Calculate lesson duration.
            sharedService.CalculateDuration(lesson);
            await unitOfWork.UpdateAsync(lesson);

            return Result.Succeed(data: question.Id);
        }

        [Authorize]
        [HttpPut("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions/{questionId}")]
        public async Task<IActionResult> Edit(int courseId, int sectionId, int lessonId, int questionId, [FromBody] QuestionEditModel form)
        {
            var question = await unitOfWork.Query<Question>().AsSingleQuery()
                .Include(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Lesson).ThenInclude(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == questionId);
            if (question == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lesson = question.LessonId == lessonId ? question.Lesson : null;
            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = question.Lesson.SectionId == sectionId ? question.Lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = question.Lesson.Section.CourseId == courseId ? question.Lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            question.Text = form.Text;
            question.AnswerType = form.AnswerType;

            await unitOfWork.UpdateAsync(question);
            await UpdateAnswers(question, form);

            // Calculate lesson duration.
            sharedService.CalculateDuration(lesson);
            await unitOfWork.UpdateAsync(lesson);

            return Result.Succeed();
        }

        [NonAction]
        private async Task UpdateAnswers(Question question, QuestionEditModel form)
        {
            var itemsToDelete = question.Answers.Where(item => !form.Answers.Any(entry => item.Id == entry.Id)).ToList();
            await unitOfWork.DeleteAsync(itemsToDelete);

            var itemsToAddOrUpdate = form.Answers.GroupJoin(question.Answers, _ => _.Id, _ => _.Id, (entry, items) => (entry, items.FirstOrDefault())).ToList();
            foreach (var (entry, item) in itemsToAddOrUpdate)
            {
                var entryIndex = itemsToAddOrUpdate.IndexOf((entry, item));
                var answer = item;

                if (answer == null)
                {
                    answer = new QuestionAnswer();
                    answer.QuestionId = question.Id;
                    await unitOfWork.CreateAsync(answer);
                }

                answer.Index = entryIndex;
                answer.Text = entry.Text;
                answer.Checked = entry.Checked;
                await unitOfWork.UpdateAsync(answer);
            }
        }

        [Authorize]
        [HttpDelete("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions/{questionId}")]
        public async Task<IActionResult> Delete(int courseId, int sectionId, int lessonId, int questionId)
        {
            var question = await unitOfWork.Query<Question>().AsSingleQuery()
                .Include(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Lesson).ThenInclude(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == questionId);
            if (question == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lesson = question.LessonId == lessonId ? question.Lesson : null;
            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = question.Lesson.SectionId == sectionId ? question.Lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = question.Lesson.Section.CourseId == courseId ? question.Lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher) && course.UserId == user.Id;
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(question);

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions/{questionId}/solve")]
        public async Task<IActionResult> Solve(int courseId, int sectionId, int lessonId, int questionId)
        {
            var question = await unitOfWork.Query<Question>().AsSingleQuery()
                .Include(_ => _.Answers.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index))
                .Include(_ => _.Lesson).ThenInclude(_ => _.Section).ThenInclude(_ => _.Course)
                .FirstOrDefaultAsync(_ => _.Id == questionId);
            if (question == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lesson = question.LessonId == lessonId ? question.Lesson : null;
            if (lesson == null) return Result.Failed(StatusCodes.Status404NotFound);

            var section = question.Lesson.SectionId == sectionId ? question.Lesson.Section : null;
            if (section == null) return Result.Failed(StatusCodes.Status404NotFound);

            var course = question.Lesson.Section.CourseId == courseId ? question.Lesson.Section.Course : null;
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            var remainingBits = user.Bits + appSettings.Course.BitRules[CourseBitRuleType.SeekAnswer].Value;
            user.Bits = remainingBits;
            await unitOfWork.UpdateAsync(user);

            return Result.Succeed(new { user.Bits });
        }

        [Authorize]
        [HttpGet("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions/{questionId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId, int lessonId, int questionId)
        {
            var courseModel = (await GetCourseModel(courseId));
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var sectionModel = courseModel.Sections.FirstOrDefault(_ => _.Id == sectionId);
            if (sectionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var lessonModel = sectionModel.Lessons.FirstOrDefault(_ => _.Id == lessonId);
            if (lessonModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var questionModel = lessonModel.Questions.FirstOrDefault(_ => _.Id == questionId);
            if (questionModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: questionModel);
        }

        [NonAction]
        private async Task<CourseModel> GetCourseModel(int courseId, bool single = true)
        {
            var course = await unitOfWork.Query<Course>()
                .AsNoTracking()
                .Include(_ => _.User)
                .FirstOrDefaultAsync(_ => _.Id == courseId);

            if (course == null) return null;

            course.Sections = await unitOfWork.Query<Section>()
                .AsNoTracking()
                .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                .Where(_ => _.CourseId == course.Id)
                .Select(section => new Section
                 {
                     CourseId = section.CourseId,
                     Index = section.Index,
                     Id = section.Id,
                     Title = single ? section.Title : null
                 })
                .ToListAsync();

            foreach (var section in course.Sections)
            {
                section.Lessons = await unitOfWork.Query<Lesson>()
                    .AsNoTracking()
                    .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                    .Where(_ => _.SectionId == section.Id)
                    .Select(lesson => new Lesson
                    {
                        SectionId = lesson.SectionId,
                        Index = lesson.Index,
                        Id = lesson.Id,
                        Title = single ? lesson.Title : null,
                        Document = lesson.Document,
                        Media = lesson.Media,
                        ExternalMediaUrl = lesson.ExternalMediaUrl,
                        Duration = lesson.Duration
                    }).ToListAsync();

                foreach (var lesson in section.Lessons)
                {
                    lesson.Questions = await unitOfWork.Query<Question>()
                        .AsNoTracking()
                        .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                        .Where(_ => _.LessonId == lesson.Id)
                        .Select(question => new Question
                        {
                            LessonId = question.LessonId,
                            Index = question.Index,
                            Id = question.Id,
                            Text = single ? question.Text : null,
                            AnswerType = question.AnswerType
                        }).ToListAsync();

                    foreach (var question in lesson.Questions)
                    {
                        question.Answers = await unitOfWork.Query<QuestionAnswer>()
                            .AsNoTracking()
                            .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                            .Where(_ => _.QuestionId == question.Id)
                            .Select(answer => new QuestionAnswer
                            {
                                QuestionId = answer.QuestionId,
                                Index = answer.Index,
                                Id = answer.Id,
                                Text = single ? answer.Text : null,
                                Checked = answer.Checked,
                            }).ToListAsync();
                    }
                }
            }

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

            var user = await HttpContext.Request.GetCurrentUserAsync();
            var permitted = user != null && (user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher));

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
            courseModel.Duration = course.Sections.SelectMany(_ => _.Lessons).Select(_ => _.Duration).Sum();

            var progresses = course.Sections.SelectMany(section => section.Lessons.SelectMany(lesson =>
            {
                var progress = user?.CourseProgresses.FirstOrDefault(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id && _.QuestionId == null);
                progress ??= new CourseProgress { CourseId = course.Id, SectionId = section.Id, LessonId = lesson.Id, QuestionId = null, Status = CourseStatus.Locked };

                var progresses = new List<CourseProgress>();
                progresses.Add(progress);

                lesson.Questions.ForEach(question =>
                {
                    progress = user?.CourseProgresses.FirstOrDefault(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id && _.QuestionId == question.Id);
                    progress ??= new CourseProgress { CourseId = course.Id, SectionId = section.Id, LessonId = lesson.Id, QuestionId = question.Id, Status = CourseStatus.Locked };
                    progresses.Add(progress);
                });
                return progresses;
            })).ToArray();
            var progress = progresses.FirstOrDefault(_ => _.Status == CourseStatus.Locked);
            if (progress != null) progress.Status = CourseStatus.Started;

            courseModel.Sections = course.Sections.Select(section =>
            {
                var sectionModel = mapper.Map<SectionModel>(section);
                sectionModel.Lessons = section.Lessons.Select(lesson =>
                {
                    var lessonModel = mapper.Map<LessonModel>(lesson);
                    lessonModel.Questions = lesson.Questions.Select(question =>
                    {
                        var progress = progresses.First(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id && _.QuestionId == question.Id);

                        var questionModel = mapper.Map<QuestionModel>(question);
                        questionModel.Answers = question.Answers.Select((answer) =>
                        {
                            var answerModel = mapper.Map<QuestionAnswerModel>(answer);
                            answerModel.Checked = (permitted) ? answer.Checked : null;
                            return answerModel;
                        }).ToArray();
                        questionModel.Correct = progress.Status == CourseStatus.Completed ? question.CheckInputs(progress.Inputs) : null;
                        questionModel.Secret = Protection.Encrypt(appSettings.Company.Name, Newtonsoft.Json.JsonConvert.SerializeObject(question.Answers.Select(_ => mapper.Map<QuestionAnswerModel>(_)), JsonSerializerSettingsDefaults.Web));
                        questionModel.Status = progress.Status;
                        return questionModel;
                    }).ToArray();
                    lessonModel.Status = GetStatus(progresses.Where(_ => _.CourseId == course.Id && _.SectionId == section.Id && _.LessonId == lesson.Id).Select(_ => _.Status).ToArray());
                    return lessonModel;
                }).ToArray();
                sectionModel.Duration = section.Lessons.Select(_ => _.Duration).Sum();

                var statuses = progresses.Where(_ => _.CourseId == course.Id && _.SectionId == section.Id).Select(_ => _.Status).ToArray();
                sectionModel.Status = GetStatus(statuses);
                sectionModel.Progress = GetProgress(statuses);

                return sectionModel;

            }).ToArray();

            courseModel.Started = progresses.Where(_ => _.CourseId == course.Id).OrderBy(_ => _.Completed).FirstOrDefault()?.Completed;
            courseModel.Completed = progresses.Where(_ => _.CourseId == course.Id).OrderByDescending(_ => _.Completed).FirstOrDefault()?.Completed;

            var statuses = progresses.Where(_ => _.CourseId == course.Id).Select(_ => _.Status).ToArray();
            courseModel.Status = GetStatus(statuses);
            courseModel.Progress = GetProgress(statuses);

            return courseModel;
        }
    }
}