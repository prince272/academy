using System;

namespace Academy.Server.Data.Entities
{
    public class Post : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Body { get; set; }

        public Media Image { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }

        public long Duration { get; set; }
    }
}