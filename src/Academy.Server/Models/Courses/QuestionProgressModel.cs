using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class QuestionProgressModel
    {
        public int? Id { get; set; }

        public bool Solve { get; set; }

        public string[] Answers { get; set; }
    }

    public class QuestionProgressValidator : AbstractValidator<QuestionProgressModel>
    {
        public QuestionProgressValidator()
        {
            RuleFor(_ => _.Answers).NotEmpty().When(_ => _.Id != null && !_.Solve);
        }
    }
}