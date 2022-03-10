using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models.Payments
{
    public class PayoutDetailsModel
    {
        public string MobileNumber { get; set; }

        public decimal Amount { get; set; }

        public PaymentMode Mode { get; set; }
    }

    public class MobileCashoutValidator : AbstractValidator<PayoutDetailsModel>
    {
        public MobileCashoutValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.MobileNumber).Phone().When(_ => _.Mode == PaymentMode.Mobile);
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}