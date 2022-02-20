namespace Academy.Server.Data.Entities
{
    public class Certificate : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public int Id { get; set; }

        public int Number { get; set; }

        public OwnedMedia Image { get; set; }

        public OwnedMedia Document { get; set; }
    }
}
