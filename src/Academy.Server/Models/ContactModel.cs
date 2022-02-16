using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Home
{
    public class ContactModel
    {
        public string Name { get; set; }

        private string info;
        public string Info
        {
            get => ValidationHelper.PhoneOrEmail(info) ?
                (ValidationHelper.TryFormatPhone(info, out string phoneNumber) ? phoneNumber : info) :
                (ValidationHelper.TryFormatEmail(info, out string email) ? email : info);
            set => info = value;
        }

        public ContactSubject Subject { get; set; }

        public string Message { get; set; }
    }

    public enum ContactSubject
    {
        ApplyAsTeacher,
        GetInTouch
    }

    public class ContactValidator : AbstractValidator<ContactModel>
    {
        public ContactValidator()
        {
            RuleFor(_ => _.Name).NotEmpty();
            RuleFor(_ => _.Info).PhoneOrEmail();
            RuleFor(_ => _.Message).NotEmpty();
        }
    }
}
