using FluentValidation;

namespace Academy.Server.Models
{
    public class TeachModal
    {
        public string Subject { get; set; }

        public string Message { get; set; }
    }


    public class TeachValidator : AbstractValidator<TeachModal>
    {
        public TeachValidator()
        {
            RuleFor(_ => _.Subject).NotEmpty();
            RuleFor(_ => _.Message).NotEmpty();
        }
    }
}
