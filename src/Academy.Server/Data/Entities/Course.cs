using Academy.Server.Models.Courses;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Data.Entities
{
    public class Course : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public string Code { get; set; }

        public CourseSubject Subject { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public CourseState State { get; set; }

        public Media Image { get; set; }

        public Media CertificateTemplate { get; set; }

        public decimal Cost { get; set; }

        public decimal Price { get; set; }

        public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    }

    public enum CourseState
    {
        Hidden,
        Visible,
        Rejected
    }

    public class CourseProgress : IEntity
    {
        public int UserId { get; set; }

        public int Id { get; set; }

        public int CourseId { get; set; }

        public int SectionId { get; set; }

        public int LessonId { get; set; }

        public int ContentId { get; set; }

        public DateTimeOffset? Completed { get; set; }

        public CourseStatus Status { get; set; }

        public string[] Checks { get; set; }
    }

    public enum CourseStatus
    {
        Completed,
        Locked,
        Started,
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
        Languages,

        [Display(Name = "Fashion Design")]
        Fashion,
    }
}