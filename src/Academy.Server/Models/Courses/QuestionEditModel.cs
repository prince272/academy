using Academy.Server.Data.Entities;
using FluentValidation;
using System.Collections.Generic;

namespace Academy.Server.Models.Courses
{
    public class QuestionEditModel
    {
        public string Text { get; set; }

        public QuestionType Type { get; set; }

        public List<QuestionAnswerEditModel> Answers { get; } = new List<QuestionAnswerEditModel>();
    }

    public class QuestionEditValidator : AbstractValidator<QuestionEditModel>
    {
        public QuestionEditValidator()
        {
            RuleFor(_ => _.Text).NotEmpty().WithName("Question");
        }
    }

    public class QuestionAnswerEditModel
    {
        public int Id { get; set; }

        public string Text { get; set; }

        public bool Checked { get; set; }
    }

    public class QuestionAnswerEditValidator : AbstractValidator<QuestionAnswerEditModel>
    {
        public QuestionAnswerEditValidator()
        {
            RuleFor(_ => _.Text).NotEmpty().WithName("Question");
        }
    }
}
