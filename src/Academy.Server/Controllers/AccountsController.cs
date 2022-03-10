using Academy.Server.Data;
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


        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignUpModel form)
        {
            var user = new User();

            if (ValidationHelper.PhoneOrEmail(form.Username))
            {
                user.PhoneNumber = form.Username;
                return Result.Failed(StatusCodes.Status400BadRequest, "Please use your email address instead.");
            }
            else user.Email = form.Username;

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
            var user = await HttpContext.Request.GetCurrentUserAsync();
            return Result.Succeed(data: mapper.Map<CurrentUserModel>(user));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> EditProfile(CurrentUserEditModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

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
                form.Code = await userManager.GenerateChangePhoneNumberTokenAsync(user, form.Username);
                await smsSender.SendAsync(form.Username, await viewRenderer.RenderToStringAsync("Sms/ConfirmAccount", (user, form)));
            }
            else
            {
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, form.Username);
                await emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: "Confirm Your Account",
                    body: await viewRenderer.RenderToStringAsync("Email/ConfirmAccount", (user, form)));
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
                await smsSender.SendAsync(form.Username, await viewRenderer.RenderToStringAsync("ChangeAccount_SMS", (subject, user, form)));
            }
            else
            {
                form.Code = await userManager.GenerateChangeEmailTokenAsync(user, form.Username);
                await emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: subject, body: await viewRenderer.RenderToStringAsync("ChangeAccount_EMAIL", (subject, user, form)));
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
                await smsSender.SendAsync(form.Username, await viewRenderer.RenderToStringAsync("ResetPassword_SMS", (subject, user, form)));
            }
            else
            {
                await emailSender.SendAsync(account: appSettings.Company.Emails.App, address: new EmailAddress { Email = form.Username },
                    subject: subject, body: await viewRenderer.RenderToStringAsync("ResetPassword_EMAIL", (subject, user, form)));
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
        [HttpPost("withdraw")]
        public async Task<IActionResult> Withdraw([FromBody] PayoutDetailsModel form)
        {
            var paymentDetails = (PaymentDetails)null;
            try
            {
                if (form.Mode == PaymentMode.Mobile)
                {
                    paymentDetails = new PaymentDetails((await paymentProcessor.GetIssuersAsync()).Where(_ => _.Type == PaymentIssuerType.Mobile).ToArray(), form.MobileNumber);
                }
                else throw new ArgumentNullException($"The payment mode is not valid.", nameof(form.Mode));
            }
            catch (ArgumentException ex) { return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.ParamName, ex.Message)); }

            var user = await HttpContext.Request.GetCurrentUserAsync();

            if (user.Balance < form.Amount)
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Amount), "Balance is insufficient."));

            var payment = new Payment();
            payment.Reason = PaymentReason.Withdrawal;
            payment.Status = PaymentStatus.Pending;
            payment.Type = PaymentType.Payout;
            payment.Title = $"Payment to {user.FullName}";
            payment.ReferenceId = user.Code;
            payment.Amount = form.Amount;
            payment.IPAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.UserId = user.Id;
            payment.PhoneNumber = user.PhoneNumber;
            payment.Email = user.Email;
            payment.FullName = user.FullName;

            payment.Mode = form.Mode;
            payment.SetData(nameof(PaymentDetails), paymentDetails);

            await unitOfWork.CreateAsync(payment);
            await paymentProcessor.ProcessAsync(payment);

            return Result.Succeed(data: new
            {
                payment.Id,
            });
        }
    }
}