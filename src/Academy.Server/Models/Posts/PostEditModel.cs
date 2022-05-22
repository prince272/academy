using Academy.Server.Data.Entities;
using FluentValidation;

namespace Academy.Server.Models.Posts
{
    public class PostEditModel
    {
        public string Title { get; set; }

        public PostCategory Category { get; set; }

        public string Description { get; set; }

        public bool Published { get; set; }

        public int? ImageId { get; set; }
    }

    public class CourseEditValidator : AbstractValidator<PostEditModel>
    {
        public CourseEditValidator()
        {
            RuleFor(_ => _.Title).NotEmpty();
        }
    }
}
