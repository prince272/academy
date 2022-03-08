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
    [Route("[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly EmailAccounts emailAccounts;
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;

        public PaymentsController(IServiceProvider serviceProvider)
        {
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            emailAccounts = serviceProvider.GetRequiredService<IOptions<EmailAccounts>>().Value;
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
        }

        [HttpPost("{paymentId}/checkout")]
        public async Task<IActionResult> Checkout(int paymentId, string returnUrl, [FromBody] PayinDetailsModel form)
        {
            PaymentDetails paymentDetails = null;
            string paymentRedirectUrl = null;

            try
            {
                if (form.Mode == PaymentMode.Mobile)
                {
                    paymentDetails = new PaymentDetails((await paymentProcessor.GetIssuersAsync()).Where(_ => _.Type == PaymentIssuerType.Mobile).ToArray(), form.MobileNumber);
                }
                else if (form.Mode == PaymentMode.External)
                {
                    if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                        throw new ArgumentException("Url is not valid.", nameof(returnUrl));

                    paymentRedirectUrl = Url.ActionLink(nameof(VerifyExternal), values: new { paymentId, returnUrl });
                }
                else throw new ArgumentNullException($"The payment mode is not valid.", nameof(form.Mode));
            }
            catch (ArgumentException ex) { return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.ParamName, ex.Message)); }

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Payin && _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            payment.Mode = form.Mode;
            payment.SetData(nameof(PaymentDetails), paymentDetails);
            payment.RedirectUrl = paymentRedirectUrl;
            await paymentProcessor.ProcessAsync(payment);

            return Result.Succeed(new
            {
                payment.Status,
                payment.ExternalUrl
            });
        }

        [HttpGet("{paymentId}/status")]
        public async Task<IActionResult> GetStatus(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: new { payment.Status });
        }

        [HttpPost("{paymentId}/verify")]
        public async Task<IActionResult> Verify(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            await paymentProcessor.VerifyAsync(payment);

            return Result.Succeed(data: new
            {
                payment.Status
            });
        }

        [HttpGet("{paymentId}/external/verify")]
        public async Task<IActionResult> VerifyExternal(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Payin && _.Id == paymentId);
            if (payment == null) return NotFound();

            await paymentProcessor.VerifyAsync(payment);

            var returnUrl = HttpUtility.ParseQueryString(new Uri(payment.RedirectUrl).Query).Get("returnUrl");

            return Redirect(returnUrl);
        }
    }
}
