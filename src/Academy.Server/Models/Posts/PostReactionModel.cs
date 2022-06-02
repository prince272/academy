using Academy.Server.Data.Entities;

namespace Academy.Server.Models.Posts
{
    public class PostReactionModel
    {
        public PostReactionType Type { get; set; }

        public int Count { get; set; }
    }
}
