using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models.Payments
{
    public class MobileTransferModel
    {
        public string MobileNumber { get; set; }

        public decimal Amount { get; set; }
    }

    public class MobileTransferValidator : AbstractValidator<MobileTransferModel>
    {
        public MobileTransferValidator()
        {
            RuleFor(_ => _.MobileNumber).Phone();
        }
    }
}