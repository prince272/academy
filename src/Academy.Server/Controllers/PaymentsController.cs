using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Models.Payments;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
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
        private readonly IPaymentProcessor paymentProcessor;
        private readonly IUnitOfWork unitOfWork;

        public PaymentsController(IServiceProvider serviceProvider)
        {
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
        }

        [HttpPost("{paymentId}/checkout/mobile")]
        public async Task<IActionResult> MobileCheckout(int paymentId, string returnUrl, MobilePayinDetailsModel form)
        {
            var paymentDetails = PaymentDetails.SetMobileDetails((await paymentProcessor.GetIssuersAsync()).Where(_ => _.Mode == PaymentMode.Mobile).ToArray(), form.MobileNumber);
            return await Checkout(paymentId, paymentDetails, returnUrl);
        }

        [HttpPost("{paymentId}/checkout/external")]
        public async Task<IActionResult> ExternalCheckout(int paymentId, string returnUrl)
        {
            var paymentDetails = PaymentDetails.SetExternalDetails();
            return await Checkout(paymentId, paymentDetails, returnUrl);
        }

        [NonAction]
        public async Task<IActionResult> Checkout(int paymentId, PaymentDetails paymentDetails, string returnUrl)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Type == PaymentType.Payin && _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            payment.RedirectUrl = Url.ActionLink(nameof(Verify), values: new { paymentId, returnUrl });

            await paymentProcessor.ProcessAsync(payment, paymentDetails);
            return Result.Succeed();
        }

        [HttpGet("{paymentId}")]
        public async Task<IActionResult> Read(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: new
            {
                payment.Id,
                payment.Title,
                payment.Mode,
                payment.Type,
                payment.Code,
                payment.Status,
                payment.ReturnUrl,
                payment.RedirectUrl,
                payment.Amount
            });
        }

        [HttpGet("{paymentId}/verify")]
        public async Task<IActionResult> Verify(int paymentId)
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
