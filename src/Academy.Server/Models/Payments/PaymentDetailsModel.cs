using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace Academy.Server.Models.Payments
{
    public class PaymentDetailsModel
    {
        public PaymentIssuerType? IssuerType { get; set; }

        public string MobileNumber { get; set; }

        public string CardNumber { get; set; }

        public string CardExpiry { get; set; }

        public string CardCvv { get; set; }

        public string ReturnUrl { get; set; }
    }

    public class PaymentDetailsValidator : AbstractValidator<PaymentDetailsModel>
    {
        public PaymentDetailsValidator(IServiceProvider serviceProvider)
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            RuleFor(_ => _.ReturnUrl).UrlOrigins(configuration.GetSection("AllowedOrigins").Get<string[]>());
        }
    }
}
