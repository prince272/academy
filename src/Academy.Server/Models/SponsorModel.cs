using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models
{
    public class SponsorModel
    {
        public string FullName { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string Message { get; set; }

        public decimal Amount { get; set; }
    }

    public class SponsorValidator : AbstractValidator<SponsorModel>
    {
        public SponsorValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.FullName).NotEmpty();
            RuleFor(_ => _.Email).Email();
            RuleFor(_ => _.PhoneNumber).Phone();
            RuleFor(_ => _.Message);

            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}
