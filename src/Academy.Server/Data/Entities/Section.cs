using System.Collections.Generic;

namespace Academy.Server.Data.Entities
{
    public class Section : IEntity
    {
        public virtual Course Course { get; set; }

        public int CourseId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Title { get; set; }

        public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}
