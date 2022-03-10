using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Data.Entities
{
    public class Question : IEntity
    {
        public virtual Lesson Lesson { get; set; }

        public int LessonId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Text { get; set; }

        public QuestionType Type { get; set; }

        public virtual ICollection<QuestionAnswer> Answers { get; set; } = new List<QuestionAnswer>();

        public bool CheckAnswer(string[] answers)
        {
            if (Type == QuestionType.SingleAnswer || Type == QuestionType.MultipleAnswer)
                return Enumerable.SequenceEqual(Answers.Where(_ => _.Checked).Select(_ => _.Id.ToString()).OrderBy(_ => _), answers.OrderBy(_ => _));

            else if (Type == QuestionType.Reorder)
                return Enumerable.SequenceEqual(Answers.Select(_ => _.Id.ToString()), answers);

            else return false;
        }
    }

    public enum QuestionType
    {
        SingleAnswer,
        MultipleAnswer,
        Reorder,
        Text
    }
}
