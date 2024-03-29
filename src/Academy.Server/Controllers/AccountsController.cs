﻿using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.SmsSender;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models.Accounts;
using Academy.Server.Models.Payments;
using Academy.Server.Utilities;
using AutoMapper;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
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
        private readonly ISmsSender smsSender;
        private readonly IViewRenderer viewRenderer;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IConfiguration configuration;
        private readonly AppSettings appSettings;

        public AccountsController(IServiceProvider serviceProvider)
        {
            userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            signInManager = serviceProvider.GetRequiredService<SignInManager<User>>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            smsSender = serviceProvider.GetRequiredService<ISmsSender>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            configuration = serviceProvider.GetRequiredService<IConfiguration>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SignUpModel form)
        {
            var user = new User();

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                user.PhoneNumber = form.Username;

                if (!form.Username.StartsWith("+233"))
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), "'Phone number' is not allowed."));

                if (await userManager.Users.AnyAsync(user => user.PhoneNumber == form.Username))
                    return Result.Failed(StatusCodes.Status400BadRequest, reason: ResultReason.DuplicateUsername, errors: new[] { new Error(nameof(form.Username), "'Phone number' is already registered.") });
            }
            else
            {
                if (await userManager.Users.AnyAsync(user => user.Email == form.Username))
                    return Result.Failed(StatusCodes.Status400BadRequest, reason: ResultReason.DuplicateUsername, errors: new[] { new Error(nameof(form.Username), "'Email' is already registered.") });

                user.Email = form.Username;
            }

            user.FirstName = form.FirstName;
            user.LastName = form.LastName;
            user.UserName = await Compute.GenerateSlugAsync($"{form.FirstName} {form.LastName}", slug => userManager.Users.AnyAsync(_ => _.UserName == slug));
            user.Registered = DateTimeOffset.UtcNow;
            user.Code = Compute.GenerateCode("USER");

            (await userManager.CreateAsync(user, form.Password)).ThrowIfFailed();

            if (await userManager.Users.CountAsync() == 1)
            {
                (await userManager.AddToRolesAsync(user, new string[] { RoleConstants.Teacher, RoleConstants.Admin })).ThrowIfFailed();
            }

            return Result.Succeed();
        }


        [HttpPost("authenticate")]
        public async Task<IActionResult> Authenticate([FromBody] SignInModel form)
        {
            var user = await userManager.FindByUsernameAsync(form.Username);
            if (user == null)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' is not registered."));
            }

            var result = await signInManager.CheckPasswordSignInAsync(user, form.Password, true);

            if (result.Succeeded)
            {
                if (!user.EmailConfirmed && !user.PhoneNumberConfirmed)
                {
                    var error = new Error(nameof(form.Username), $"'{(ValidationHelper.PhoneOrEmail(form.Username) ? "Phone number" : "Email")}' is not confirmed.");
                    return Result.Failed(StatusCodes.Status400BadRequest, reason: ResultReason.ConfirmUsername, errors: new[] { error });
                }

                await signInManager.SignOutAsync();
                await signInManager.SignInAsync(user, isPersistent: true);
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
            var user = await HttpContext.Request.GetCurrentUserAsync();
            return Result.Succeed(data: mapper.Map<ProfileModel>(user));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> EditProfile(ProfileEditModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            user.FirstName = form.FirstName;
            user.LastName = form.LastName;
            user.Bio = form.Bio;
            user.Avatar = (await unitOfWork.FindAsync<Media>(form.AvatarId));
            user.FacebookLink = form.FacebookLink;
            user.InstagramLink = form.InstagramLink;
            user.LinkedinLink = form.LinkedinLink;
            user.TwitterLink = form.TwitterLink;
            user.WhatsAppLink = form.WhatsAppLink;

            await unitOfWork.UpdateAsync(user);

            return Result.Succeed(data: mapper.Map<ProfileModel>(user));
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
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, form.Username);
                (smsSender.SendAsync(form.Username, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/ConfirmAccount", (user, form))))).Forget();
            }
            else
            {
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, form.Username);
                (emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: "Confirm Your Account",
                    body: await viewRenderer.RenderToStringAsync("Email/ConfirmAccount", (user, form)))).Forget();
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
            var user = await HttpContext.Request.GetCurrentUserAsync();

            string subject = "Change Your Account";

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, form.Username);
                (smsSender.SendAsync(form.Username, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/ChangeAccount", (user, form))))).Forget();
            }
            else
            {
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, form.Username);
                (emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: subject, body: await viewRenderer.RenderToStringAsync("Email/ChangeAccount", (user, form)))).Forget();
            }

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("change")]
        public async Task<IActionResult> ChangeAccount([FromBody] ChangeAccountModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();
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
            var user = await HttpContext.Request.GetCurrentUserAsync();

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

            string subject = "Reset Your Password";
            form.Code = await userManager.GeneratePasswordResetTokenAsync(user);

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                (smsSender.SendAsync(form.Username, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/ResetPassword", (user, form))))).Forget();
            }
            else
            {
                (emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: subject, body: await viewRenderer.RenderToStringAsync("Email/ResetPassword", (user, form)))).Forget();
            }

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

        [Authorize]
        [HttpPost("mobile/deposit")]
        public async Task<IActionResult> Withdraw(string returnUrl, [FromBody] MobilePayoutDetailsModel form)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var paymentDetails = PaymentDetails.SetMobileDetails((await paymentProcessor.GetIssuersAsync()).Where(_ => _.Mode == PaymentMode.Mobile).ToArray(), form.MobileNumber);

            var user = await HttpContext.Request.GetCurrentUserAsync();

            var permitted = user.HasRoles(RoleConstants.Admin) || user.HasRoles(RoleConstants.Teacher);
            if (!permitted) return Result.Failed(StatusCodes.Status403Forbidden);

            if (user.Balance < form.Amount)
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Amount), "Balance is insufficient."));

            var payment = new Payment();
            payment.Reason = PaymentReason.Withdrawal;
            payment.Status = PaymentStatus.Pending;
            payment.Type = PaymentType.Payout;
            payment.Title = $"Payment to {user.FullName}";
            payment.Code = user.Code;
            payment.Amount = form.Amount;
            payment.IPAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.UserId = user.Id;
            payment.PhoneNumber = user.PhoneNumber;
            payment.Email = user.Email;
            payment.FullName = user.FullName;
            payment.ReturnUrl = returnUrl;
            payment.Mode = PaymentMode.Mobile;

            await unitOfWork.CreateAsync(payment);
            await paymentProcessor.ProcessAsync(payment, paymentDetails);

            return Result.Succeed(data: payment.Id);
        }
    }
}