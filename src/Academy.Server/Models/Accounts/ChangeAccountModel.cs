using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Academy.Server.Models.Accounts
{
    public class ChangeAccountModel
    {
        public string Username { get; set; }

        public string Code { get; set; }
    }


    public class ChangeAccountValidator : AbstractValidator<ChangeAccountModel>
    {
        public ChangeAccountValidator(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            RuleFor(_ => _.Username).NewUsername().MustAsync(async (value, cancellationToken) =>
            {
                var predicate = await userManager.Users.AnyAsync(user => user.Email == value, cancellationToken);
                predicate = predicate || await userManager.Users.AnyAsync(user => user.PhoneNumber == value, cancellationToken);
                return !predicate;
            })
                .WithMessage((model, value) => $"'{(ValidationHelper.PhoneOrEmail(value) ? "Phone number" : "Email")}' is already registered."); ;
        }
    }
}
