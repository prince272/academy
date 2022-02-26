using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models
{
    public class SponsorModel
    {
        public string ContactName { get; set; }

        private string contactInfo;
        public string ContactInfo
        {
            get => ValidationHelper.PhoneOrEmail(contactInfo) ?
                (ValidationHelper.TryFormatPhone(contactInfo, out string phoneNumber) ? phoneNumber : contactInfo) :
                (ValidationHelper.TryFormatEmail(contactInfo, out string email) ? email : contactInfo);
            set => contactInfo = value;
        }

        public decimal Amount { get; set; }


    }

    public class SponsorValidator : AbstractValidator<SponsorModel>
    {
        public SponsorValidator(IServiceProvider serviceProvider)
        {
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.ContactInfo).PhoneOrEmail();
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}
