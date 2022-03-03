using Academy.Server.Utilities;
using FluentValidation;
using System;

namespace Academy.Server.Models.Accounts
{
    public class ChangeAccountModel
    {
        public string Username { get; set; }

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
