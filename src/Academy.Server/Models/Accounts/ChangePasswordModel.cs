using Academy.Server.Utilities;
using FluentValidation;
using System;

namespace Academy.Server.Models.Accounts
{
    public class ChangePasswordModel
    {
        public string CurrentPassword { get; set; }

        public string NewPassword { get; set; }
    }

    public class ChangePasswordValidator : AbstractValidator<ChangePasswordModel>
    {
        public ChangePasswordValidator()
        {
            RuleFor(_ => _.CurrentPassword).NotEmpty();
            RuleFor(_ => _.NewPassword).NewPassword();
        }
    }
}
