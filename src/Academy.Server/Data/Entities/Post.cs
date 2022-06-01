using System;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Data.Entities
{
    public class Post : IEntity
    {
        public virtual User Teacher { get; set; }

        public int TeacherId { get; set; }

        public int Id { get; set; }

        public string Code { get; set; }

        public PostCategory Category { get; set; }

        public string Title { get; set; }

        public string Summary { get; set; }

        public string Description { get; set; }

        public Media Image { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public long Duration { get; set; }
    }

    public enum PostCategory
    {
        [Display(Name = "News")]
        News,

        [Display(Name = "Insights")]
        Insights,

        [Display(Name = "Careers")]
        Careers
    }

    public class PostReaction : IEntity
    {
        public int Id { get; set; }

        public virtual Post Post { get; set; }

        public int PostId { get; set; }

        public string IPAddress { get; set; }

        public string UAString { get; set; }

        public PostReactionType Type { get; set; }
    }

    public enum PostReactionType
    {
        Like,
        Love,
        Surprised,
        Sad,
        Angry
    }
}