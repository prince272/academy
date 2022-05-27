using Academy.Server.Utilities;
using FluentValidation;

namespace Academy.Server.Models.Accounts
{
    public class ProfileEditModel
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public int? AvatarId { get; set; }

        public string FacebookLink { get; set; }

        public string InstagramLink { get; set; }

        public string LinkedinLink { get; set; }

        public string TwitterLink { get; set; }

        public string WhatsAppLink { get; set; }
    }

    public class ProfileEditValidator : AbstractValidator<ProfileEditModel>
    {
        public ProfileEditValidator()
        {
            RuleFor(_ => _.FirstName).NotEmpty();
            RuleFor(_ => _.LastName).NotEmpty();
            RuleFor(_ => _.Bio).NotEmpty();

            RuleFor(_ => _.FacebookLink).Url();
            RuleFor(_ => _.InstagramLink).Url();
            RuleFor(_ => _.LinkedinLink).Url();
            RuleFor(_ => _.TwitterLink).Url();
            RuleFor(_ => _.WhatsAppLink).Url();
        }
    }
}
