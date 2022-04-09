using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class LessonEditModel
    {
        public string Title { get; set; }

        public string Document { get; set; }

        public int? MediaId { get; set; }

        public string ExternalMediaUrl { get; set; }
    }

    public class LessonEditValidator : AbstractValidator<LessonEditModel>
    {
        public LessonEditValidator()
        {
            RuleFor(_ => _.Title).NotEmpty();
            RuleFor(_ => _.ExternalMediaUrl).Url();
        }
    }
}
