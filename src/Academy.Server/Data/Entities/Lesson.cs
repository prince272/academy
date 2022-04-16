using System.Collections.Generic;

namespace Academy.Server.Data.Entities
{
    public class Lesson : IEntity
    {
        public virtual Section Section { get; set; }

        public int SectionId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public virtual ICollection<Content> Contents { get; set; } = new List<Content>();
    }
}
