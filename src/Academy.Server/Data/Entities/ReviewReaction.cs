namespace Academy.Server.Data.Entities
{
    public class ReviewReaction : IEntity
    {
        public int Id { get; set; }

        public virtual Review Review { get; set; }

        public int ReviewId { get; set; }

        public virtual User User { get; set; }

        public int UserId { get; set; }

        public ReviewReactionType Type { get; set; }
    }

    public enum ReviewReactionType
    {
        Inappropriate,
        Spam,
        Helpful,
        NotHelpful
    }
}
