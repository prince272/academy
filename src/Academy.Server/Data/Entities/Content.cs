using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Data.Entities
{
    public class Content : IEntity
    {
        public virtual Lesson Lesson { get; set; }

        public int LessonId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Summary { get; set; }

        public ContentType Type { get; set; }

        public string Document { get; set; }

        public Media Media { get; set; }

        public string ExternalMediaUrl { get; set; }


        public string Question { get; set; }

        public AnswerType AnswerType { get; set; }

        public ContentAnswer[] Answers { get; set; }

        public string[] Checks { get; set; }
    }

    public class ContentAnswer
    {
        public int Id { get; set; }

        public string Text { get; set; }

        public bool Checked { get; set; }
    }

    public enum ContentType
    {
        Explanation,
        Question
    }

    public enum AnswerType
    {
        SelectSingle,
        SelectMultiple,
        Reorder,
        Text
    }
}
