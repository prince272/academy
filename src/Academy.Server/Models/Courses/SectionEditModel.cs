using FluentValidation;

namespace Academy.Server.Models.Courses
{
    public class SectionEditModel
    {
        public string Title { get; set; }
    }

    public class SectionFormValidator : AbstractValidator<SectionEditModel>
    {
        public SectionFormValidator()
        {
            RuleFor(_ => _.Title).NotEmpty();
        }
    }
}
