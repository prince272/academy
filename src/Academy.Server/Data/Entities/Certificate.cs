namespace Academy.Server.Data.Entities
{
    public class Certificate : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public int Id { get; set; }

        public string Number { get; set; }

        public Media Image { get; set; }

        public Media Document { get; set; }
    }
}
