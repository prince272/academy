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
using Microsoft.AspNetCore.Http;
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
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> userManager;
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;
        private readonly IViewRenderer viewRenderer;

        public UsersController(IServiceProvider serviceProvider)
        {
            userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }


        [Authorize]
        [HttpPost("{userId}/sponsor")]
        public async Task<IActionResult> Sponsor(int userId, [FromBody] SponsorModel form)
        {
            var user = await unitOfWork.Query<User>().FirstOrDefaultAsync(_ => _.Id == userId);
            if (user == null) return Result.Failed(StatusCodes.Status404NotFound);

            var payment = new Payment();
            payment.Reason = PaymentReason.Sponsorship;
            payment.Status = PaymentStatus.Pending;
            payment.Type = PaymentType.Payin;
            payment.Title = "Buy Me a Coffee";
            payment.Code = user.Code;
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
    }
}
