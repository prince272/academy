using Academy.Server.Utilities;
using FluentValidation;
using System;

namespace Academy.Server.Models.Accounts
{
    public class ResetPasswordModel
    {
        private string username;
        public string Username
        {
            get => ValidationHelper.PhoneOrEmail(username) ?
                (ValidationHelper.TryFormatPhone(username, out string phoneNumber) ? phoneNumber : username) :
                (ValidationHelper.TryFormatEmail(username, out string email) ? email : username);
            set => username = value;
        }

        public string Password { get; set; }

        public string Code { get; set; }
    }

    public class ResetPasswordValidator : AbstractValidator<ResetPasswordModel>
    {
        public ResetPasswordValidator()
        {
            RuleFor(_ => _.Username).NotEmpty();
            RuleFor(_ => _.Password).NewPassword();
        }
    }
}
