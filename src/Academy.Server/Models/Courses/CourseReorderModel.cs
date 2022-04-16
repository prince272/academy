namespace Academy.Server.Models.Courses
{
    public class CourseReorderModel
    {
        public CourseReorderType Type { get; set; }

        public Position Source { get; set; }

        public Position Destination { get; set; }

        public class Position
        {
            public int Index { get; set; }

            public int Id { get; set; }
        }
    }

    public enum CourseReorderType
    {
        Section,
        Lesson,
        Content
    }
}