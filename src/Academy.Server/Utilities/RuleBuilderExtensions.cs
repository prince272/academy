using Academy.Server.Data.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace Academy.Server.Utilities
{
    public static class RuleBuilderExtensions
    {
        public static IRuleBuilderOptions<T, string> NewUsername<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            // source: https://github.com/deanilvincent/check-password-strength
            var options = ruleBuilder
                .NotEmpty()
                .WithName("Email or phone number")
                .Must((model, value) =>
                 ValidationHelper.TryFormatPhone(value, out string _) ||
                 ValidationHelper.TryFormatEmail(value, out string _))
                .WithMessage((model, value) => $"'{(ValidationHelper.PhoneOrEmail(value) ? "Phone number" : "Email")}' is not valid.");
            return options;
        }

        public static IRuleBuilder<T, string> NewPassword<T>(this IRuleBuilder<T, string> ruleBuilder, int minimumLength = 6)
        {
            var options = ruleBuilder
                .NotEmpty()
                .MinimumLength(minimumLength)
                .Matches("[A-Z]").WithMessage("'{PropertyName}' must contain at least 1 upper case.")
                .Matches("[a-z]").WithMessage("'{PropertyName}' must contain at least 1 lower case.")
                .Matches("[0-9]").WithMessage("'{PropertyName}' must contain at least 1 digit.")
                .Matches("[^a-zA-Z0-9]").WithMessage("'{PropertyName}' must contain at least 1 special character.");

            return options;
        }

        public static IRuleBuilderOptions<T, string> PhoneOrEmail<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            // source: https://github.com/deanilvincent/check-password-strength
            var options = ruleBuilder
                .NotEmpty()
                .WithName("Email or phone number")
                .Must((model, value) =>
                 ValidationHelper.TryFormatPhone(value, out string _) ||
                 ValidationHelper.TryFormatEmail(value, out string _))
                .WithMessage((model, value) => $"'{(ValidationHelper.PhoneOrEmail(value) ? "Phone number" : "Email")}' is not valid.");
            return options;
        }

        public static IRuleBuilderOptions<T, string> Phone<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .NotEmpty()
                .Must((model, value) =>
                 ValidationHelper.TryFormatPhone(value, out string _))
                .WithMessage((model, value) => "'{PropertyName}' is not valid.");
            return options;
        }

        public static IRuleBuilderOptions<T, string> Email<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .NotEmpty()
                .Must((model, value) =>
                 ValidationHelper.TryFormatEmail(value, out string _))
                .WithMessage((model, value) => "'{PropertyName}' is not valid.");
            return options;
        }

        public static IRuleBuilderOptions<T, string> UrlOrigins<T>(this IRuleBuilder<T, string> ruleBuilder, string[] origins)
        {
            var options = ruleBuilder.NotEmpty().Must((model, value) =>
            {
                if (value == null) return false;
                var allowed = origins.Any(origin => Uri.Compare(new Uri(origin), new Uri(value), UriComponents.SchemeAndServer, UriFormat.UriEscaped, StringComparison.InvariantCultureIgnoreCase) == 0);
                return allowed;
            }).WithMessage("'{PropertyName}' is not allowed.");
            return options;
        }

        public static IRuleBuilderOptions<T, string> Url<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .Must((model, value) =>
            {
                if (string.IsNullOrWhiteSpace(value))
                    return true;

                Uri uriResult;
                bool result = Uri.TryCreate(value, UriKind.Absolute, out uriResult);
                return result;
            }).WithMessage("'{PropertyName}' is not valid.");
            return options;
        }
    }
}