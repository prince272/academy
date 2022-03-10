using System;

namespace Academy.Server.Data.Entities
{
    public class Review : IEntity
    {
        public int CourseId { get; set; }

        public virtual Course Course { get; set; }

        public int Id { get; set; }

        public string Message { get; set; }

        public int Rating { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public virtual User User { get; set; }

        public int UserId { get; set; }

        public bool Approved { get; set; }

        public string Reply { get; set; }
    }
}
