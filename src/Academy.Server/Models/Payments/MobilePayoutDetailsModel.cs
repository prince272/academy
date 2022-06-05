using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models.Payments
{
    public class MobilePayoutDetailsModel
    {
        public string MobileNumber { get; set; }

        public decimal Amount { get; set; }
    }

    public class MobilePayoutDetailsValidator : AbstractValidator<MobilePayoutDetailsModel>
    {
        public MobilePayoutDetailsValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.MobileNumber).Phone();
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}