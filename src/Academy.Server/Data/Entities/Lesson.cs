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

        public Media Document { get; set; }

        public Media Media { get; set; }

        public long Duration { get; set; }

        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    }
}
