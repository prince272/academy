using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class CourseProgressModel
    {
        public int LessonId { get; set; }

        public int? QuestionId { get; set; }

        public bool Skip { get; set; }

        public string[] Answers { get; set; }
    }

    public class ProgressValidator : AbstractValidator<CourseProgressModel>
    {
        public ProgressValidator()
        {
            RuleFor(_ => _.Answers).NotEmpty().When(_ => _.QuestionId != null && !_.Skip);
        }
    }
}