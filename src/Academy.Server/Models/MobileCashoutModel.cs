using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models.Payments
{
    public class MobileCashoutModel
    {
        public string MobileNumber { get; set; }

        public decimal Amount { get; set; }
    }

    public class MobileCashoutValidator : AbstractValidator<MobileCashoutModel>
    {
        public MobileCashoutValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.MobileNumber).Phone();
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}