using Academy.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Models.Courses
{
    public class CourseSearchModel
    {
        public int? UserId { get; set; }

        public CourseSubject? Subject { get; set; }

        public CourseSort Sort { get; set; }
    }


    public enum CourseSort
    {
        [Display(Name = "Popular")]
        Popular,

        [Display(Name = "Newest")]
        Newest
    }
}
