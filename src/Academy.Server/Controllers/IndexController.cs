using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Models;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Home;
using Academy.Server.Utilities;
using Humanizer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [ApiController]
    public class IndexController : ControllerBase
    {
        private readonly Settings settings;
        private readonly IEmailSender emailSender;
        private readonly EmailAccounts emailAccounts;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;

        public IndexController(IServiceProvider serviceProvider)
        {
            settings = serviceProvider.GetRequiredService<IOptions<Settings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            emailAccounts = serviceProvider.GetRequiredService<IOptions<EmailAccounts>>().Value;
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
        }

        [HttpGet("/")]
        public IActionResult Index()
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

            var CourseSubjects = GetEnumerations<CourseSubject>();
            var CourseSorts = GetEnumerations<CourseSort>();
            var CourseSubmissions = GetEnumerations<CourseSubmission>();
            var Company = settings.Company;
            var Currency = settings.Currency;

            return Result.Succeed(new
            {
                Company,
                Currency,
                CourseSorts,
                CourseSubjects,
                CourseSubmissions
            });
        }


        [HttpPost("/contact")]
        public async Task<IActionResult> Contact([FromBody] ContactModel form)
        {
            var subject = $"[{form.Name} - {form.Info}] {form.Subject.ToString().Humanize()}";
            await emailSender.SendAsync(emailAccounts.Support, emailAccounts.Support, subject, form.Message);
            return Result.Succeed();
        }

        [HttpPost("/sponsor")]
        public async Task<IActionResult> Sponsor([FromBody] SponsorModel form)
        {
            var payment = new Payment();
            payment.Title = "Payment to sponsor";
            payment.Status = PaymentStatus.Pending;
            payment.Amount = form.Amount;
            payment.ContactName = form.ContactName;
            payment.ContactInfo = form.ContactInfo;
            payment.Type = PaymentType.Debit;
            payment.IpAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();

            await unitOfWork.CreateAsync(payment);
            return Result.Succeed(data: payment.Id);
        }
    }
}