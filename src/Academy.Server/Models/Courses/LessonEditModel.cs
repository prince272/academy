using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class LessonEditModel
    {
        public string Title { get; set; }
    }

    public class LessonEditValidator : AbstractValidator<LessonEditModel>
    {
        public LessonEditValidator()
        {
            RuleFor(_ => _.Title).NotEmpty();
        }
    }
}
