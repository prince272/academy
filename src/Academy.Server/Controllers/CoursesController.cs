﻿using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Models.Accounts;
using Academy.Server.Models.Courses;
using Academy.Server.Services;
using Academy.Server.Utilities;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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

        public CoursesController(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            documentProcessor = serviceProvider.GetRequiredService<IDocumentProcessor>();
            sharedService = serviceProvider.GetRequiredService<ISharedService>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }

        [Authorize]
        [HttpPost("/courses")]
        public async Task<IActionResult> Create([FromBody] CourseEditModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourses()) return Result.Failed(StatusCodes.Status403Forbidden);

            var course = new Course();
            course.Title = form.Title;
            course.Subject = form.Subject;
            course.Description = form.Description;
            course.Created = DateTimeOffset.UtcNow;
            course.Published = form.Published ? course.Published ?? DateTimeOffset.UtcNow : null;
            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
            course.Image = (await unitOfWork.FindAsync<Media>(form.ImageId));
            course.CertificateTemplate = (await unitOfWork.FindAsync<Media>(form.CertificateTemplateId));
            course.UserId = user.Id; // Set the owner of the course.

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            course.Title = form.Title;
            course.Subject = form.Subject;
            course.Description = form.Description;
            course.Updated = DateTimeOffset.UtcNow;
            course.Published = form.Published ? course.Published ?? DateTimeOffset.UtcNow : null;
            course.Cost = Math.Round(form.Cost, 2, MidpointRounding.AwayFromZero);
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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

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

            var user = await HttpContext.GetCurrentUserAsync();

            if (user != null && user.CanManageCourses())
            {

            }
            else
            {
                query = query.Where(course => course.Published != null);
            }


            if (search?.UserId != null) query = query.Where(_ => _.Id == search.UserId);

            if (search?.Subject != null) query = query.Where(_ => _.Subject == search.Subject);


            var pageInfo = new PageInfo(await query.CountAsync(), pageNumber, pageSize);

            query = (pageInfo.SkipItems > 0 ? query.Skip(pageInfo.SkipItems) : query).Take(pageInfo.PageSize);

            var pageItems = await (await (query.Select(_ => _.Id).ToListAsync())).SelectAsync(async courseId => {
                var courseModel = await GetCourseModel(courseId);
                if (courseModel == null) throw new ArgumentException();
                return courseModel;
            });

            return Result.Succeed(data: TypeMerger.Merge(new { Items = pageItems }, pageInfo));
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/pay")]
        public async Task<IActionResult> Pay(int courseId)
        {
            var courseModel = await GetCourseModel(courseId);
            if (courseModel == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.GetCurrentUserAsync();

            var payment = new Payment();
            payment.Title = courseModel.Title;
            payment.Reason = PaymentReason.Course;
            payment.ReasonId = courseModel.Id;
            payment.Status = PaymentStatus.Pending;
            payment.Amount = courseModel.Price;
            payment.Type = PaymentType.Debit;
            payment.IpAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.PhoneNumber = user.PhoneNumber;
            payment.Email = user.Email;

            await unitOfWork.CreateAsync(payment);
            return Result.Succeed(data: new { PaymentId = payment.Id });
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/progress")]
        public async Task<IActionResult> Progresss(int courseId, [FromBody] CourseProgressModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();
            var questionProgress = user.Progresses.FirstOrDefault(_ => _.Type == CourseProgressType.Question && _.Id == form.QuestionId);

            if (form.QuestionId != null)
            {
                if (form.Skip)
                {
                    var remainingBits = user.Bits + appSettings.Currency.BitRules.First(_ => _.Type == BitRuleType.SkipQuestion).Value;
                    if (remainingBits < 0)
                    {
                        var requiredBits = Math.Abs(remainingBits);
                        return Result.Failed(StatusCodes.Status400BadRequest, $"{"bit".ToQuantity(requiredBits)} is required to find the answer.");
                    }
                    else
                    {
                        user.Bits = remainingBits;
                    }
                }

                if (questionProgress == null) user.Progresses.Add(questionProgress = new CourseProgress() { CourseId = courseId, Type = CourseProgressType.Question, Id = form.QuestionId.Value, Started = DateTimeOffset.UtcNow });
                questionProgress.Choices.Add((form.Skip, form.Answers));
                user.Progresses.Move(user.Progresses.IndexOf(questionProgress), 0);
            }

            var lessonProgress = user.Progresses.FirstOrDefault(_ => _.Type == CourseProgressType.Lesson && _.Id == form.LessonId);
            if (lessonProgress == null)
            {
                user.Progresses.Add(lessonProgress = new CourseProgress() { CourseId = courseId, Type = CourseProgressType.Lesson, Id = form.LessonId, Started = DateTimeOffset.UtcNow });
                user.Progresses.Move(user.Progresses.IndexOf(lessonProgress), 0);
            }

            var courseModel = await GetCourseModel(courseId);
            if (courseModel.Price > 0 && !courseModel.Purchased)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, "Payment required to take this course.");
            }

            var questionModel = courseModel.Sections.SelectMany(_ => _.Lessons).SelectMany(_ => _.Questions).FirstOrDefault(_ => _.Id == form.QuestionId);
            if (questionModel != null && questionModel.Status == CourseStatus.Completed)
            {
                if (questionProgress.Completed == null)
                {
                    if (!questionProgress.Choices.Any(_ => _.Skip))
                    {
                        user.Bits += (questionModel.Choices.FirstOrDefault() ?
                            appSettings.Currency.BitRules.First(_ => _.Type == BitRuleType.AnswerCorrectly).Value :
                            appSettings.Currency.BitRules.First(_ => _.Type == BitRuleType.AnswerWrongly).Value);
                    }

                    questionProgress.Completed = DateTimeOffset.UtcNow;
                }
            }

            var lessonModel = courseModel.Sections.SelectMany(_ => _.Lessons).FirstOrDefault(_ => _.Id == form.LessonId);
            if (lessonModel.Status == CourseStatus.Completed)
            {
                if (lessonProgress.Completed == null)
                {
                    user.Bits += appSettings.Currency.BitRules.First(_ => _.Type == BitRuleType.CompleteLesson).Value;
                    lessonProgress.Completed = DateTimeOffset.UtcNow;
                }
            }

            await unitOfWork.UpdateAsync(user);
            return Result.Succeed();
        }


        [Authorize]
        [HttpPost("/courses/{courseId}/certificate")]
        public async Task<IActionResult> Certificate(int courseId)
        {
            var user = await HttpContext.GetCurrentUserAsync();

            var courseModel = await GetCourseModel(courseId);

            if (courseModel == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            if (courseModel.Status != CourseStatus.Completed)
                return Result.Failed(StatusCodes.Status400BadRequest);

            if (courseModel.Course.CertificateTemplate == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var certificate = user.Certificates.FirstOrDefault(_ => _.CourseId == courseModel.Id);
            if (certificate == null)
            {
                user.Certificates.Add(certificate = new Certificate
                {
                    UserId = user.Id,
                    CourseId = courseModel.Id,
                    Number = DateTimeOffset.UtcNow.Year + Compute.GenerateNumber(8)
                });
                await unitOfWork.CreateAsync(certificate);
            }

            var certificateFields = new Dictionary<string, object>();
            certificateFields.Add("UserFullName", user.FullName);
            certificateFields.Add("CourseTitle", courseModel.Title);
            certificateFields.Add("CourseStarted", courseModel.Started);
            certificateFields.Add("CourseCompleted", courseModel.Completed);
            certificateFields.Add("CertificateNumber", certificate.Number);

            using var certificateTemplateStream = await storageProvider.GetStreamAsync(courseModel.Course.CertificateTemplate.Path);
            using var certificateMergedStream = new MemoryStream();
            await documentProcessor.MergeAsync(certificateTemplateStream, certificateMergedStream, certificateFields);

            async Task<Media> CreateMedia(MediaType mediaType, DocumentFormat format)
            {
                using var certificateStream = new MemoryStream();
                await documentProcessor.ConvertAsync(certificateMergedStream, certificateStream, format);

                var mediaName = $"{courseModel.Title} Certificate.{format.ToString().ToLowerInvariant()}";
                var mediaPath = appSettings.Media.GetPath("certificates", mediaType, mediaName);

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

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/reorder")]
        public async Task<IActionResult> Reorder(int courseId, [FromBody] ReorderModel form)
        {
            var course = (await GetCourseModel(courseId))?.Course;

            if (course == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.GetCurrentUserAsync();

            if (!user.CanManageCourse(course))
                return Result.Failed(StatusCodes.Status400BadRequest);

            var source = form.Source;
            var destination = form.Destination;

            if (source == null || destination == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            if (source.Id == destination.Id &&
                source.Index == destination.Index)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var sections = course.Sections.OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index).ToList();

            if (form.Type == ReorderType.Section)
            {
                sections.Move(source.Index, destination.Index);

                sections.ForEach((section, sectionIndex) =>
                {
                    section.Index = sectionIndex;
                });

                await unitOfWork.UpdateAsync(sections);
            }
            else if (form.Type == ReorderType.Lesson)
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
                        lesson.Index = lessonIndex;
                    });

                    await unitOfWork.UpdateAsync(sourceLessons);
                }
                else
                {
                    sourceLessons.Transfer(source.Index, destination.Index, destinationLessons);

                    sourceLessons.ForEach((lesson, lessonIndex) =>
                    {
                        lesson.SectionId = sourceSection.Id;
                        lesson.Index = lessonIndex;
                    });
                    destinationLessons.ForEach((lesson, lessonIndex) =>
                    {
                        lesson.SectionId = destinationSection.Id;
                        lesson.Index = lessonIndex;
                    });

                    await unitOfWork.UpdateAsync(sourceLessons);
                    await unitOfWork.UpdateAsync(destinationLessons);
                }
            }
            else if (form.Type == ReorderType.Question)
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
                        question.Index = questionIndex;
                    });

                    await unitOfWork.UpdateAsync(sourceQuestions);
                }
                else
                {
                    sourceQuestions.Transfer(source.Index, destination.Index, destinationQuestions);

                    sourceQuestions.ForEach((question, questionIndex) =>
                    {
                        question.LessonId = sourceLesson.Id;
                        question.Index = questionIndex;
                    });
                    destinationQuestions.ForEach((question, questionIndex) =>
                    {
                        question.LessonId = destinationLesson.Id;
                        question.Index = questionIndex;
                    });

                    await unitOfWork.UpdateAsync(sourceQuestions);
                    await unitOfWork.UpdateAsync(destinationQuestions);
                }
            }
            else
            {
                throw new NotImplementedException();
            }

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("/courses/{courseId}/sections")]
        public async Task<IActionResult> Create(int courseId, [FromBody] SectionEditModel form)
        {
            var course = await unitOfWork.Query<Course>()
                .FirstOrDefaultAsync(_ => _.Id == courseId);
            if (course == null) return Result.Failed(StatusCodes.Status404NotFound);

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            var section = new Section();
            section.Title = form.Title;
            section.CourseId = course.Id; // Set the owner of the section.

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(section);

            return Result.Succeed();
        }

        [HttpGet("/courses/{courseId}/sections/{sectionId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId)
        {
            var courseModel = (await GetCourseModel(courseId, sectionId));
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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            var lesson = new Lesson();
            lesson.Title = form.Title;
            lesson.Document = Sanitizer.SanitizeHtml(form.Document);
            lesson.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));
            lesson.SectionId = section.Id;  // Set the owner of the lesson.

            lesson.Duration = await sharedService.CalculateDurationAsync(lesson);

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            lesson.Title = form.Title;
            lesson.Document = Sanitizer.SanitizeHtml(form.Document);
            lesson.Media = (await unitOfWork.FindAsync<Media>(form.MediaId));

            // Calculate lesson duration.
            lesson.Duration = await sharedService.CalculateDurationAsync(lesson);

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(lesson);

            return Result.Succeed();
        }

        [Authorize]
        [HttpGet("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId, int lessonId)
        {
            var courseModel = (await GetCourseModel(courseId, sectionId, lessonId));
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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            var question = new Question();
            question.Text = Sanitizer.SanitizeHtml(form.Text);
            question.Type = form.Type;
            question.LessonId = lesson.Id; // Set the owner of the question.

            await unitOfWork.CreateAsync(question);
            await UpdateAnswers(question, form);

            // Calculate question duration.
            question.Duration = await sharedService.CalculateDurationAsync(question);
            await unitOfWork.UpdateAsync(question);

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            question.Text = Sanitizer.SanitizeHtml(form.Text);
            question.Type = form.Type;

            await unitOfWork.UpdateAsync(question);
            await UpdateAnswers(question, form);

            // Calculate question duration.
            question.Duration = await sharedService.CalculateDurationAsync(question);
            await unitOfWork.UpdateAsync(question);

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

            var user = await HttpContext.GetCurrentUserAsync();
            if (!user.CanManageCourse(course)) return Result.Failed(StatusCodes.Status403Forbidden);

            await unitOfWork.DeleteAsync(question);

            return Result.Succeed();
        }

        [Authorize]
        [HttpGet("/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/questions/{questionId}")]
        public async Task<IActionResult> Read(int courseId, int sectionId, int lessonId, int questionId)
        {
            var courseModel = (await GetCourseModel(courseId, sectionId, lessonId, questionId));
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
        private async Task<CourseModel> GetCourseModel(int courseId, int? sectionId = null, int? lessonId = null, int? questionId = null)
        {
            var course = await unitOfWork.Query<Course>().AsNoTrackingWithIdentityResolution()
                                .Include(_ => _.User)
                                .FirstOrDefaultAsync(_ => _.Id == courseId);

            if (course == null) return null;

            course.Sections = await unitOfWork.Query<Section>().AsNoTrackingWithIdentityResolution()
                             .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                             .Where(_ => _.CourseId == course.Id)
                             .ToListAsync();

            foreach (var section in course.Sections)
            {
                section.Lessons = await unitOfWork.Query<Lesson>().AsNoTrackingWithIdentityResolution()
                    .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                    .Where(_ => _.SectionId == section.Id)
                    .ProjectTo<Lesson>(new MapperConfiguration(config =>
                    {
                        var map = config.CreateMap<Lesson, Lesson>();
                        map.ForMember(_ => _.Document, config => config.MapFrom(_ => _.Id == lessonId ? _.Document : null));
                    })).ToListAsync();

                foreach (var lesson in section.Lessons)
                {
                    lesson.Questions = await unitOfWork.Query<Question>().AsNoTrackingWithIdentityResolution()
                        .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                        .Where(_ => _.LessonId == lesson.Id)
                        .ProjectTo<Question>(new MapperConfiguration(config =>
                        {
                            var map = config.CreateMap<Question, Question>();
                        })).ToListAsync();

                    foreach (var question in lesson.Questions)
                    {
                        question.Answers = await unitOfWork.Query<QuestionAnswer>().AsNoTrackingWithIdentityResolution()
                            .OrderBy(_ => _.Index == -1).ThenBy(_ => _.Index)
                            .Where(_ => _.QuestionId == question.Id)
                            .ProjectTo<QuestionAnswer>(new MapperConfiguration(config =>
                            {
                                var map = config.CreateMap<QuestionAnswer, QuestionAnswer>();
                                map.ForMember(_ => _.Text, config => config.MapFrom(_ => _.Question.LessonId == lessonId ? _.Text : null));
                            })).ToListAsync();
                    }
                }
            }

            var user = await HttpContext.GetCurrentUserAsync();
            var userCanManageCourse = user?.CanManageCourse(course) ?? false;

            CourseStatus GetStatus(CourseStatus[] statuses)
            {
                return statuses.Any(status => status == CourseStatus.Started) ? CourseStatus.Started :
                  statuses.All(status => status == CourseStatus.Completed) &&
                  statuses.Any() ? CourseStatus.Completed : CourseStatus.Locked;
            }

            double GetProgress(CourseStatus[] statuses)
            {
                var complete = statuses.Count(status => status == CourseStatus.Completed);
                return (Math.Round(complete / (double)Math.Max(statuses.Count(), 1), 2, MidpointRounding.ToZero));
            };

            var started = true;

            var courseCertificate = user?.Certificates.FirstOrDefault(_ => _.CourseId == course.Id);
            var coursePurchased = user != null ? await unitOfWork.Query<Payment>()
                .AnyAsync(_ => _.UserId == user.Id &&
                               _.Reason == PaymentReason.Course &&
                               _.ReasonId == course.Id &&
                               _.Status == PaymentStatus.Complete) : false;

            var courseModel = mapper.Map<CourseModel>(course);
            courseModel.Course = course;
            courseModel.Certificate = mapper.Map<CertificateModel>(courseCertificate);
            courseModel.Price = await sharedService.CalculatePriceAsync(course);
            courseModel.Purchased = coursePurchased;
            courseModel.Duration = course.Sections.SelectMany(_ => _.Lessons).Select(_ => _.Duration).Sum();
            courseModel.Sections = course.Sections.Select(section =>
            {
                var sectionModel = mapper.Map<SectionModel>(section);
                sectionModel.Duration = section.Lessons.Select(_ => _.Duration).Sum();
                sectionModel.Lessons = section.Lessons.Select(lesson =>
                {
                    var progress = user?.Progresses.FirstOrDefault(_ => _.Type == CourseProgressType.Lesson && _.Id == lesson.Id);

                    var lessonModel = mapper.Map<LessonModel>(lesson);
                    lessonModel.Questions = lesson.Questions.Select(question =>
                    {
                        var progress = user?.Progresses.FirstOrDefault(_ => _.Type == CourseProgressType.Question && _.Id == question.Id);

                        var questionModel = mapper.Map<QuestionModel>(question);
                        questionModel.Text = (userCanManageCourse || progress != null) ? question.Text : null;
                        questionModel.Answers = question.Answers.Select((answer, answerIndex) =>
                        {
                            var answerModel = mapper.Map<QuestionAnswerModel>(answer);
                            answerModel.Checked = (userCanManageCourse || progress != null) ? answer.Checked : null;
                            return answerModel;
                        }).ToArray();

                        if (progress != null)
                        {
                            questionModel.Choices = progress.Choices.Select(_ => _.Skip || question.CheckAnswer(_.Answers)).ToArray();
                            questionModel.Status = CourseStatus.Completed;
                        }
                        else
                        {
                            questionModel.Choices = Array.Empty<bool>();
                            questionModel.Status = CourseStatus.Locked;
                        }

                        return questionModel;
                    }).ToArray();
                    lessonModel.Status = GetStatus(lessonModel.Questions.Select(question => question.Status)
                        .Prepend(progress != null ? CourseStatus.Completed : CourseStatus.Locked).ToArray());

                    if (lessonModel.Status == CourseStatus.Locked && started)
                    {
                        lessonModel.Status = CourseStatus.Started;
                        lessonModel.Questions.ForEach(questionModel =>
                        {
                            if (questionModel.Status == CourseStatus.Locked && started)
                            {
                                questionModel.Status = CourseStatus.Started;
                                started = false;
                            }

                        });
                        started = false;
                    }

                    return lessonModel;
                }).ToArray();

                var statuses = sectionModel.Lessons
                .SelectMany(lessonModel => lessonModel.Questions.Select(questionModel => questionModel.Status).Prepend(lessonModel.Status)).ToArray();

                sectionModel.Status = GetStatus(statuses);
                sectionModel.Progress = GetProgress(statuses);

                return sectionModel;

            }).ToArray();

            courseModel.Started = user?.Progresses.Where(_ => _.CourseId == course.Id).OrderBy(_ => _.Started).FirstOrDefault()?.Started;
            courseModel.Completed = user?.Progresses.Where(_ => _.CourseId == course.Id).OrderByDescending(_ => _.Completed).FirstOrDefault()?.Completed;

            var statuses = courseModel.Sections.SelectMany(_ => _.Lessons)
                .SelectMany(lessonModel => lessonModel.Questions.Select(questionModel => questionModel.Status).Prepend(lessonModel.Status)).ToArray();

            courseModel.Status = GetStatus(statuses);
            courseModel.Progress = GetProgress(statuses);

            return courseModel;
        }
    }
}