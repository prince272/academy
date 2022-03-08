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
            payment.Type = PaymentType.Payin;
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
            return Result.Succeed(data: new
            {
                payment.Id,
                payment.Title,
                payment.Amount,
                payment.Status
            });
        }
    }
}