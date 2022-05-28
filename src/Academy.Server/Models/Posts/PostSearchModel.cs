using Academy.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Models.Posts
{
    public class PostSearchModel
    {
        public PostCategory? Category { get; set; }

        public PostSort Sort { get; set; }

        public string Query { get; set; }
    }


    public enum PostSort
    {
        [Display(Name = "Popular")]
        Popular,

        [Display(Name = "Newest")]
        Newest,

        [Display(Name = "Updated")]
        Updated
    }
}
