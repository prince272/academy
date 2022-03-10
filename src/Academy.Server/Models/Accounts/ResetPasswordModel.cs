using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Accounts
{
    public class ResetPasswordModel
    {
        public string Username { get; set; }

        public string Password { get; set; }

        public string Code { get; set; }
    }

    public class ResetPasswordValidator : AbstractValidator<ResetPasswordModel>
    {
        public ResetPasswordValidator()
        {
            RuleFor(_ => _.Username).PhoneOrEmail();
            RuleFor(_ => _.Password).NewPassword();
        }
    }
}
