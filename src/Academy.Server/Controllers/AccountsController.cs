using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models.Accounts;
using Academy.Server.Utilities;
using AutoMapper;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly UserManager<User> userManager;
        private readonly SignInManager<User> signInManager;
        private readonly IMapper mapper;
        private readonly IUnitOfWork unitOfWork;
        private readonly IEmailSender emailSender;
        private readonly EmailAccounts emailAccounts;
        private readonly IViewRenderer viewRenderer;

        public AccountsController(IServiceProvider serviceProvider)
        {
            userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            signInManager = serviceProvider.GetRequiredService<SignInManager<User>>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            emailAccounts = serviceProvider.GetRequiredService<IOptions<EmailAccounts>>().Value;
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignUpModel form)
        {
            var user = new User();

            if (ValidationHelper.PhoneOrEmail(form.Username))
                user.PhoneNumber = form.Username;
            else user.Email = form.Username;

            user.FirstName = form.FirstName;
            user.LastName = form.LastName;
            user.UserName = await Compute.GenerateSlugAsync($"{form.FirstName} {form.LastName}", slug => userManager.Users.AnyAsync(_ => _.UserName == slug));
            user.Registered = DateTimeOffset.UtcNow;

            (await userManager.CreateAsync(user, form.Password)).ThrowIfFailed();

            if (await userManager.Users.CountAsync() == 1)
            {
                (await userManager.AddToRolesAsync(user, new string[] { RoleNames.Teacher, RoleNames.Manager })).ThrowIfFailed();
            }

            return Result.Succeed();
        }

        [HttpPost("signin")]
        public async Task<IActionResult> Signin([FromBody] SignInModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' does not exist."));
            }

            var result = await signInManager.CheckPasswordSignInAsync(user, form.Password, true);

            if (result.Succeeded)
            {
                if (!user.EmailConfirmed && !user.PhoneNumberConfirmed)
                {
                    var error = new Error(Errors.ConfirmUsername, $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' is not confirmed.");
                    return Result.Failed(StatusCodes.Status400BadRequest, error);
                }

                await signInManager.SignInAsync(user, true);
                return Result.Succeed();
            }
            else if (result.IsLockedOut)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, message: "Account has been locked-out.");
            }
            else if (result.IsNotAllowed)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, message: "Account is not allowed.");
            }
            else
            {
                var error = new Error(nameof(form.Password), "'Password' is not correct.");
                return Result.Failed(StatusCodes.Status400BadRequest, error);
            }
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await HttpContext.GetCurrentUserAsync();
            return Result.Succeed(data: mapper.Map<CurrentUserModel>(user));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> EditProfile(CurrentUserEditModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();

            user.FirstName = form.FirstName;
            user.LastName = form.LastName;
            user.Bio = form.Bio;
            user.Avatar = (await unitOfWork.FindAsync<Media>(form.AvatarId));

            await unitOfWork.UpdateAsync(user);

            return Result.Succeed(data: mapper.Map<CurrentUserModel>(user));
        }

        [HttpPost("confirm/send")]
        public async Task<IActionResult> SendConfirmAccount([FromBody] ConfirmAccountModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' does not exist."));
            }

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, user.PhoneNumber);
            }
            else
            {
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, user.Email);

                string subject = "Confirm your email address";
                string body = await viewRenderer.RenderToStringAsync("EmailConfirmAccount", (subject, user, form));

                await emailSender.SendAsync(
                    account: emailAccounts.Notification,
                    address: new EmailAddress { Email = user.Email, DisplayName = user.FullName },
                    subject: subject, body: body);
            }

            return Result.Succeed();
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmAccount([FromBody] ConfirmAccountModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' does not exist."));
            }

            var result = default(IdentityResult);

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                result = await userManager.ChangePhoneNumberAsync(user, user.PhoneNumber, form.Code);
            }
            else
            {
                result = await userManager.ChangeEmailAsync(user, user.Email, form.Code);
            }

            if (!result.Succeeded)
            {
                if (result.Errors.Any(_ => _.Code == "InvalidToken"))
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Code), "'Code' is not a valid."));

                return Result.Failed(StatusCodes.Status400BadRequest, message: result.Errors.Select(_ => _.Description).Humanize());
            }

            return Result.Succeed();
        }



        [Authorize]
        [HttpPost("change/send")]
        public async Task<IActionResult> SendChangeAccount([FromBody] ChangeAccountModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();


            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                var newPhoneNumber = form.Username;
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, newPhoneNumber);
            }
            else
            {
                var newEmail = form.Username;
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, newEmail);

                string subject = "Change your email address";
                string body = await viewRenderer.RenderToStringAsync("EmailChangeAccount", (subject, user, form));

                await emailSender.SendAsync(
                    account: emailAccounts.Notification,
                    address: new EmailAddress { Email = newEmail, DisplayName = user.FullName },
                    subject: subject,
                    body: body);
            }

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("change")]
        public async Task<IActionResult> ChangeAccount([FromBody] ChangeAccountModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();
            var result = default(IdentityResult);


            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                var newPhoneNumber = form.Username;
                result = await userManager.ChangePhoneNumberAsync(user, newPhoneNumber, form.Code);
            }
            else
            {
                var newEmail = form.Username;
                result = await userManager.ChangeEmailAsync(user, newEmail, form.Code);
            }

            if (!result.Succeeded)
            {
                if (result.Errors.Any(_ => _.Code == "InvalidToken"))
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Code), "'Code' is not a valid."));

                return Result.Failed(StatusCodes.Status400BadRequest, message: result.Errors.Select(_ => _.Description).Humanize());
            }

            return Result.Succeed();
        }


        [Authorize]
        [HttpPost("password/change")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel form)
        {
            var user = await HttpContext.GetCurrentUserAsync();

            var result = await userManager.ChangePasswordAsync(user, form.CurrentPassword, form.NewPassword);

            if (!result.Succeeded)
            {
                if (result.Errors.Any(_ => _.Code == "PasswordMismatch"))
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.CurrentPassword), "'Current password' is not correct."));

                return Result.Failed(StatusCodes.Status400BadRequest, message: result.Errors.Select(_ => _.Description).Humanize());
            }

            return Result.Succeed();
        }



        [HttpPost("password/reset/send")]
        public async Task<IActionResult> SendResetPassword([FromBody] ResetPasswordModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' does not exist."));
            }

            form.Code = await userManager.GeneratePasswordResetTokenAsync(user);

            if (user.Email == form.Username)
            {
                form.Code = await userManager.GeneratePasswordResetTokenAsync(user);

                string subject = "Reset your password";
                await emailSender.SendAsync(
                    account: emailAccounts.Notification,
                    address: new EmailAddress { Email = user.Email, DisplayName = user.FullName },
                    subject: subject,
                    body: await viewRenderer.RenderToStringAsync("EmailResetPassword", (subject, user, form)));
            }
            else if (user.PhoneNumber == form.Username)
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, form.Username);

            return Result.Succeed();
        }

        [HttpPost("password/reset")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' does not exist."));
            }

            var result = await userManager.ResetPasswordAsync(user, form.Code, form.Password);

            if (!result.Succeeded)
            {
                if (result.Errors.Any(_ => _.Code == "InvalidToken"))
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Code), "'Code' is not a valid."));

                return Result.Failed(StatusCodes.Status400BadRequest, message: result.Errors.Select(_ => _.Description).Humanize());
            }

            return Result.Succeed();
        }
    }
}