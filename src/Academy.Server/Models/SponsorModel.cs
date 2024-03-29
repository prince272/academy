﻿using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models
{
    public class SponsorModel
    {
        public decimal Amount { get; set; }
    }

    public class SponsorValidator : AbstractValidator<SponsorModel>
    {
        public SponsorValidator(IServiceProvider serviceProvider)
        {
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            RuleFor(_ => _.Amount).LessThanOrEqualTo(settings.Currency.Limit).GreaterThan(0);
        }
    }
}
