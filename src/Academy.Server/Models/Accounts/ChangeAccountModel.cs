using Academy.Server.Utilities;
using FluentValidation;
using System;

namespace Academy.Server.Models.Accounts
{
    public class ChangeAccountModel
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


    public class ChangeAccountValidator : AbstractValidator<ChangeAccountModel>
    {
        public ChangeAccountValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.Username).NewUsername(serviceProvider);
        }
    }
}
