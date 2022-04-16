using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class ContentProgressModel
    {
        public string[] Inputs { get; set; }

        public bool Solve { get; set; }
    }

    public class ContentProgressValidator : AbstractValidator<ContentProgressModel>
    {
        public ContentProgressValidator()
        {
        }
    }
}