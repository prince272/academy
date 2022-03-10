using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Accounts
{
    public class SignInModel
    {
        public string Username { get; set; }

        public string Password { get; set; }
    }

    public class SignInValidator : AbstractValidator<SignInModel>
    {
        public SignInValidator()
        {
            RuleFor(_ => _.Username).PhoneOrEmail();
            RuleFor(_ => _.Password).NotEmpty();
        }
    }
}