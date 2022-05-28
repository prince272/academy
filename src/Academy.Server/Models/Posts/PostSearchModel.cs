using Academy.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server.Models.Posts
{
    public class PostSearchModel
    {
        public PostCategory? Category { get; set; }

        public PostSort Sort { get; set; }

        public int? RelatedId { get; set; }

        public string Query { get; set; }
    }


    public enum PostSort
    {
        [Display(Name = "Trending")]
        Trending,

        [Display(Name = "Latest")]
        Latest,

        [Display(Name = "Recent")]
        Recent
    }
}
