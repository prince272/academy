using Academy.Server.Data.Entities;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Models.Users;
using Academy.Server.Utilities;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace Academy.Server.Models.Courses
{
    public class CourseModel
    {
        public UserModel User { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public CourseSubject Subject { get; set; }

        public string Description { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public MediaModel Image { get; set; }

        public MediaModel CertificateTemplate { get; set; }

        public CertificateModel Certificate { get; set; }

        public long Duration { get; set; }

        public decimal Progress { get; set; }

        public SectionModel[] Sections { get; set; }

        public CourseStatus Status { get; set; }

        public decimal? Cost { get; set; }

        public decimal Price { get; set; }

        public bool Purchased { get; set; }

        public DateTimeOffset? Started { get; set; }

        public DateTimeOffset? Completed { get; set; }

        [JsonIgnore]
        public Course Course { get; set; }

        public int Learners { get; set; }
    }

    public class SectionModel
    {
        public int CourseId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public decimal Progress { get; set; }

        public long Duration { get; set; }

        public CourseStatus Status { get; set; }

        public LessonModel[] Lessons { get; set; }
    }

    public class LessonModel
    {
        public int SectionId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Document { get; set; }

        public MediaModel Media { get; set; }

        public long Duration { get; set; }

        public CourseStatus Status { get; set; }

        public QuestionModel[] Questions { get; set; }
    }

    public class QuestionModel
    {
        public int LessonId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Text { get; set; }

        public QuestionType Type { get; set; }

        public CourseStatus Status { get; set; }

        public long Duration { get; set; }

        public QuestionAnswerModel[] Answers { get; set; }

        public bool[] Choices { get; set; }
    }

    public class QuestionAnswerModel
    {
        public int QuestionId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Text { get; set; }

        public bool? Checked { get; set; }
    }

    public class MediaModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public MediaType Type { get; set; }

        public string ContentType { get; set; }

        public long Size { get; set; }

        public long? Duration { get; set; }

        public string Url { get; set; }

    }

    public class CertificateModel
    {
        public int CourseId { get; set; }

        public int UserId { get; set; }

        public int Id { get; set; }

        public MediaModel Image { get; set; }

        public MediaModel Document { get; set; }
    }

    public enum CourseStatus
    {
        Completed,
        Locked,
        Started,
        Timeout
    }

    public class CourseModelProfile : Profile
    {
        public CourseModelProfile()
        {
            CreateMap<Course, CourseModel>();
        }
    }

    public class SectionModelProfile : Profile
    {
        public SectionModelProfile()
        {
            CreateMap<Section, SectionModel>();
        }
    }

    public class LessonModelProfile : Profile
    {
        public LessonModelProfile()
        {
            CreateMap<Lesson, LessonModel>();
        }
    }

    public class QuestionModelProfile : Profile
    {
        public QuestionModelProfile()
        {
            CreateMap<Question, QuestionModel>();
        }
    }

    public class QuestionAnswerModelProfile : Profile
    {
        public QuestionAnswerModelProfile()
        {
            CreateMap<QuestionAnswer, QuestionAnswerModel>();
        }
    }

    public class MediaModelProfile : Profile
    {
        public MediaModelProfile(IServiceProvider serviceProvider)
        {
            var storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            CreateMap<Media, MediaModel>()
                .ForMember(dest => dest.Url, opt => opt.MapFrom(src => storageProvider.GetUrl(src.Path)));
        }
    }

    public class CertificateModelProfile : Profile
    {
        public CertificateModelProfile()
        {
            CreateMap<Certificate, CertificateModel>();
        }
    }
}
