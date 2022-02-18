﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Academy.Server.Data.Entities
{
    public class Course : IEntity
    {
        public virtual User User { get; set; }  

        public int UserId { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public CourseSubject Subject { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public virtual Media Image { get; set; }

        public int? ImageId { get; set; }

        public virtual Media CertificateTemplate { get; set; }

        public int? CertificateTemplateId { get; set; }

        public decimal Cost { get; set; }

        public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    }

    public enum CourseSubject
    {
        [Display(Name = "Art & Design")]
        Art,

        [Display(Name = "Business & Finance ")]
        Business,

        [Display(Name = "Food & Drink")]
        Food,

        [Display(Name = "Health & Medicine")]
        Health,

        [Display(Name = "Mathematics")]
        Mathematics,

        [Display(Name = "Science")]
        Science,

        [Display(Name = "Information Technology")]
        IT,

        [Display(Name = "Music")]
        Music,

        [Display(Name = "Languages")]
        Languages
    }
}