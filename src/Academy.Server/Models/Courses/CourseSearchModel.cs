using Academy.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Models.Courses
{
    public class CourseSearchModel
    {
        public CourseSubject? Subject { get; set; }

        public CourseSort Sort { get; set; }

        public int? RelatedId { get; set; }

        public string Query { get; set; }
    }


    public enum CourseSort
    {
        [Display(Name = "Trending")]
        Trending,

        [Display(Name = "Latest")]
        Latest,

        [Display(Name = "Recent")]
        Recent
    }
}
