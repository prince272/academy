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

        public bool Check(string[] inputs)
        {
            if (inputs == null) return false;

            if (Type == QuestionType.SelectSingle || Type == QuestionType.SelectMultiple)
                return Answers.Where(_ => _.Checked).Select(_ => _.Id.ToString()).OrderBy(_ => _).SequenceEqual(inputs.OrderBy(_ => _));

            else if (Type == QuestionType.Reorder)
                return Answers.Select(_ => _.Id.ToString()).SequenceEqual(inputs);

            else return false;
        }
    }

    public enum QuestionType
    {
        SelectSingle,
        SelectMultiple,
        Reorder,
        Text
    }
}
