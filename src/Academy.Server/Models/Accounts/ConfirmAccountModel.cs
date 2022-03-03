using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Accounts
{
    public class ConfirmAccountModel
    {
        public string Username { get; set; }

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
