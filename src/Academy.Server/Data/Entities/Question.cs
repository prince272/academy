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

        public AnswerType AnswerType { get; set; }

        public virtual ICollection<QuestionAnswer> Answers { get; set; } = new List<QuestionAnswer>();

        public bool CheckInputs(string[] inputs)
        {
            if (inputs == null) return false;

            if (AnswerType == AnswerType.SelectSingle || AnswerType == AnswerType.SelectMultiple)
                return Answers.Where(_ => _.Checked).Select(_ => _.Id.ToString()).OrderBy(_ => _).SequenceEqual(inputs.OrderBy(_ => _));

            else if (AnswerType == AnswerType.Reorder)
                return Answers.Select(_ => _.Id.ToString()).SequenceEqual(inputs);

            else return false;
        }
    }

    public enum AnswerType
    {
        SelectSingle,
        SelectMultiple,
        Reorder,
        Text
    }
}
