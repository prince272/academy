using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Models;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Home;
using Academy.Server.Models.Payments;
using Academy.Server.Utilities;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Academy.Server.Controllers
{
    [ApiController]
    public class IndexController : ControllerBase
    {
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly EmailAccounts emailAccounts;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;

        public IndexController(IServiceProvider serviceProvider)
        {
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            emailAccounts = serviceProvider.GetRequiredService<IOptions<EmailAccounts>>().Value;
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
        }

        [HttpGet("/")]
        public async Task<IActionResult> Index()
        {
            object[] GetEnumerations<TEnum>() where TEnum : struct, Enum => Enum.GetValues<TEnum>().Select(@enum =>
            {
                var display = AttributeHelper.GetMemberAttribute<DisplayAttribute>(@enum.GetType().GetMember(@enum.ToString())[0]);

                return new
                {
                    Name = display?.Name ?? @enum.ToString().Humanize(),
                    Description = display?.Description,
                    Value = @enum,
                };
            }).ToArray();

            var CourseSubjects = await Enum.GetValues<CourseSubject>().SelectAsync(async subject =>
            {
                var count = await unitOfWork.Query<Course>().CountAsync(_ => _.Subject == subject && _.Published != null);
                var display = AttributeHelper.GetMemberAttribute<DisplayAttribute>(subject.GetType().GetMember(subject.ToString())[0]);

                return new
                {
                    Name = display?.Name ?? subject.ToString().Humanize(),
                    Description = display?.Description,
                    Value = subject,
                    Count = count
                };
            });
            var CourseSorts = GetEnumerations<CourseSort>();
            var Company = appSettings.Company;
            var Currency = appSettings.Currency;

            return Result.Succeed(new
            {
                Company,
                Currency,
                CourseSorts,
                CourseSubjects,
            });
        }


        [HttpPost("/contact")]
        public async Task<IActionResult> Contact([FromBody] ContactModel form)
        {
            var subject = $"[{form.FullName} - {form.Subject.ToString().Humanize()}";
            await emailSender.SendAsync(emailAccounts.App, emailAccounts.Support, subject, form.Message);
            return Result.Succeed();
        }

        [HttpPost("/sponsor")]
        public async Task<IActionResult> Sponsor([FromBody] SponsorModel form)
        {
            var payment = new Payment();
            payment.Reason = PaymentReason.Sponsorship;
            payment.Status = PaymentStatus.Pending;
            payment.Title = "Sponsorship";
            payment.ReferenceId = Compute.GenerateCode("SPON");
            payment.Amount = form.Amount;
            payment.IPAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.UserId = null;
            payment.PhoneNumber = form.PhoneNumber;
            payment.Email = form.Email;
            payment.FullName = form.FullName;

            await unitOfWork.CreateAsync(payment);
            return Result.Succeed(data: new { PaymentId = payment.Id });
        }

        [Authorize]
        [HttpPost("cashout/mobile")]
        public async Task<IActionResult> CashoutMobile([FromBody] MobileCashoutModel form)
        {
            var mobileDetails = (MobileDetails)null;

            try
            {
                var mobileIssuers = (await paymentProcessor.GetIssuersAsync()).Where(_ => _.Type == PaymentIssuerType.Mobile).ToArray();
                mobileDetails = new MobileDetails(mobileIssuers, form.MobileNumber);
            }
            catch (ArgumentException ex) { return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.ParamName, ex.Message)); }

            var user = await HttpContext.GetCurrentUserAsync();

            if (user.Balance < form.Amount)
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(nameof(form.Amount), "Balance is insufficient."));

            var payment = new Payment();
            payment.Reason = PaymentReason.Withdrawal;
            payment.Status = PaymentStatus.Pending;
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
            payment.SetData(nameof(MobileDetails), mobileDetails);

            await paymentProcessor.CashoutAsync(payment);

            return Result.Succeed();
        }

        [HttpPost("cashin/{paymentId}/mobile")]
        public async Task<IActionResult> CashinMobile(int paymentId, string returnUrl, [FromBody] MobileCashinModel form)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Cashin && _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            var mobileDetails = (MobileDetails)null;

            try
            {
                var mobileIssuers = (await paymentProcessor.GetIssuersAsync()).Where(_ => _.Type == PaymentIssuerType.Mobile).ToArray();
                mobileDetails = new MobileDetails(mobileIssuers, form.MobileNumber);
            }
            catch (ArgumentException ex) { return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.ParamName, ex.Message)); }

            payment.SetData(nameof(MobileDetails), mobileDetails);
            payment.RedirectUrl = Url.ActionLink(nameof(CashinConfirm), values: new { paymentId, returnUrl });
            await paymentProcessor.CashinAsync(payment);
            return Result.Succeed();
        }

        [HttpPost("cashin/{paymentId}/checkout")]
        public async Task<IActionResult> CashinCheckout(int paymentId, string returnUrl)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Cashin && _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            payment.RedirectUrl = Url.ActionLink(nameof(CashinConfirm), values: new { paymentId, returnUrl });
            await paymentProcessor.CashinAsync(payment);
            return Result.Succeed(data: new { payment.CheckoutUrl });
        }

        [HttpGet("cashin/{paymentId}/confirm")]
        public async Task<IActionResult> CashinConfirm(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Cashin && _.Id == paymentId);
            if (payment == null) return NotFound();

            await paymentProcessor.ConfirmAsync(payment);

            var returnUrl = HttpUtility.ParseQueryString(new Uri(payment.RedirectUrl).Query).Get("returnUrl");

            return Redirect(returnUrl);
        }

        [HttpGet("cashin/{paymentId}/details")]
        public async Task<IActionResult> CashinDetails(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Cashin && _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: new
            {
                payment.Title,
                payment.Amount,
                payment.Status,
                payment.CheckoutUrl
            });
        }
    }
}