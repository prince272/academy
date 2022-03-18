using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class QuestionProgressModel
    {
        public int? Id { get; set; }

        public string[] Inputs { get; set; }
    }

    public class QuestionProgressValidator : AbstractValidator<QuestionProgressModel>
    {
        public QuestionProgressValidator()
        {
            RuleFor(_ => _.Inputs).NotEmpty().When(_ => _.Id != null);
        }
    }
}