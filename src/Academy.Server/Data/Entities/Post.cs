﻿using System;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Data.Entities
{
    public class Post : IEntity
    {
        public virtual User Teacher { get; set; }

        public int TeacherId { get; set; }

        public int Id { get; set; }

        public string Code { get; set; }

        public PostCatgory Catgory { get; set; }

        public string Title { get; set; }

        public string Summary { get; set; }

        public string Description { get; set; }

        public Media Image { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public long Duration { get; set; }
    }

    public enum PostCatgory
    {
        [Display(Name = "News")]
        News,

        [Display(Name = "Insights")]
        Insights,

        [Display(Name = "Career Development")]
        Career
    }
}