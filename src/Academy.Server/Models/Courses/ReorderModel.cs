namespace Academy.Server.Models.Courses
{
    public class ReorderModel
    {
        public ReorderType Type { get; set; }

        public Position Source { get; set; }

        public Position Destination { get; set; }

        public class Position
        {
            public int Index { get; set; }

            public int Id { get; set; }
        }
    }

    public enum ReorderType
    {
        Section,
        Lesson,
        Question
    }
}