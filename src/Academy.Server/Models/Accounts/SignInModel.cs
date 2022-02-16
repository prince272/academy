using Academy.Server.Utilities;
using FluentValidation;
using System;

namespace Academy.Server.Models.Accounts
{
    public class SignInModel
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