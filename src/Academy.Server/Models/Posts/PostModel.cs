using Academy.Server.Data.Entities;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Members;
using System;
using AutoMapper;

namespace Academy.Server.Models.Posts
{
    public class PostModel
    {
        public TeacherModel Teacher { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public PostCategory Category { get; set; }

        public string Summary { get; set; }

        public string Description { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public MediaModel Image { get; set; }

        public long Duration { get; set; }
    }

    public class PostModelProfile : Profile
    {
        public PostModelProfile()
        {
            CreateMap<Post, PostModel>();
        }
    }

}
