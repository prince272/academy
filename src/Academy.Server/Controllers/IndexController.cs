using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Posts;
using Academy.Server.Utilities;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly UserManager<User> userManager;
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;
        private readonly IViewRenderer viewRenderer;

        public IndexController(IServiceProvider serviceProvider)
        {
            userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
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

            var Company = TypeMerger.Merge(new { Emails = new { Support = appSettings.Company.Emails.Info.Email } }, appSettings.Company);
            var Currency = appSettings.Currency;
            var Course = TypeMerger.Merge(new
            {
                Sorts = GetEnumerations<CourseSort>(),
                Subjects = GetEnumerations<CourseSubject>()
            }, appSettings.Course);

            var Post = new
            {
                Sorts = GetEnumerations<PostSort>(),
                Categories = GetEnumerations<PostCategory>()
            };

            return Result.Succeed(new
            {
                Company,
                Currency,
                Course,
                Post
            });
        }


        [HttpPost("/contact")]
        public async Task<IActionResult> Contact([FromBody] ContactModel form)
        {
             (emailSender.SendAsync(account: appSettings.Company.Emails.App, address: appSettings.Company.Emails.Info,
                subject: $"Message from {form.FullName}",
                body: await viewRenderer.RenderToStringAsync("Email/ContactSent", form))).Forget();

             (emailSender.SendAsync(account: appSettings.Company.Emails.Info, address: new EmailAddress { Email = form.Email },
                subject: "Your Message Has Been Received",
                body: await viewRenderer.RenderToStringAsync("Email/ContactReceived", form))).Forget();

            return Result.Succeed();
        }

        [Authorize]
        [HttpPost("/sponsor")]
        public async Task<IActionResult> Sponsor([FromBody] SponsorModel form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            var payment = new Payment();
            payment.Reason = PaymentReason.Sponsorship;
            payment.Status = PaymentStatus.Pending;
            payment.Type = PaymentType.Payin;
            payment.Title = "Become a Sponsor";
            payment.ReferenceId = Compute.GenerateCode("SPON");
            payment.Amount = form.Amount;
            payment.IPAddress = Request.GetIPAddress();
            payment.UAString = Request.GetUAString();
            payment.Issued = DateTimeOffset.UtcNow;
            payment.UserId = user.Id;
            payment.PhoneNumber = user.PhoneNumber;
            payment.Email = user.Email;
            payment.FullName = user.FullName;

            await unitOfWork.CreateAsync(payment);
            return Result.Succeed(data: payment.Id);
        }

        [Authorize]
        [HttpPost("teach")]
        public async Task<IActionResult> Teach([FromBody] TeachModal form)
        {
            var user = await HttpContext.Request.GetCurrentUserAsync();

            if (!user.HasRoles(RoleConstants.Teacher))
                (await userManager.AddToRolesAsync(user, new string[] { RoleConstants.Teacher })).ThrowIfFailed();

            return Result.Succeed();
        }
    }
}