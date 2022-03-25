using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models
{
    public class ContactModel
    {
        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string Subject { get; set; }

        public string Message { get; set; }
    }

    public class ContactValidator : AbstractValidator<ContactModel>
    {
        public ContactValidator()
        {
            RuleFor(_ => _.FullName).NotEmpty();
            RuleFor(_ => _.Email).Email();
            RuleFor(_ => _.PhoneNumber).Phone();
            RuleFor(_ => _.Subject).NotEmpty();
            RuleFor(_ => _.Message).NotEmpty();
        }
    }
}