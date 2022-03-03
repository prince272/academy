﻿using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Academy.Server.Models.Accounts
{
    public class SignUpModel
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }
    }

    public class SignUpValidator : AbstractValidator<SignUpModel>
    {
        public SignUpValidator(IServiceProvider serviceProvider)
        {
            RuleFor(_ => _.FirstName).NotEmpty();

            RuleFor(_ => _.LastName).NotEmpty();

            RuleFor(_ => _.Username).NewUsername(serviceProvider);

            RuleFor(_ => _.Password).NewPassword();
        }
    }
}