using System;

namespace Academy.Server.Data.Entities
{
    public class Post : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public virtual Media Image { get; set; }

        public int? ImageId { get; set; }

        public DateTimeOffset Created { get; set; }

        public DateTimeOffset? Updated { get; set; }

        public DateTimeOffset? Published { get; set; }
    }
}