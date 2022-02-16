using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Accounts
{
    public class ConfirmAccountModel
    {
        private string username;
        public string Username
        {
            get => ValidationHelper.PhoneOrEmail(username) ?
                (ValidationHelper.TryFormatPhone(username, out string phoneNumber) ? phoneNumber : username) :
                (ValidationHelper.TryFormatEmail(username, out string email) ? email : username);
            set => username = value;
        }

        public string Code { get; set; }
    }

    public class ConfirmAccountValidator : AbstractValidator<ConfirmAccountModel>
    {
        public ConfirmAccountValidator()
        {
            RuleFor(_ => _.Username).NotEmpty();
        }
    }
}
