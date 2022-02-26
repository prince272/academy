using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Utilities;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
        private readonly IUnitOfWork unitOfWork;
        private readonly IPaymentProcessor paymentProcessor;

        public PaymentsController(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();
        }

        [HttpGet("{paymentId}")]
        public async Task<IActionResult> Read(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            return Result.Succeed(data: new
            {
                payment.Title,
                payment.Amount,
                payment.Status,
                payment.CheckoutUrl
            });
        }

        [HttpPost("{paymentId}/mobile/process")]
        public async Task<IActionResult> ProcessMobile(int paymentId, string returnUrl, [FromBody] MobileDetails form)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            try
            {
                payment.RedirectUrl = Url.ActionLink(nameof(Callback), values: new { paymentId, returnUrl });
                payment.SetData(nameof(MobileDetails), form);
                await paymentProcessor.ProcessAsync(payment);
                return Result.Succeed();
            }
            catch (MobileDetailsException ex)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.Name, ex.Message));
            }
        }

        [HttpPost("{paymentId}/checkout")]
        public async Task<IActionResult> Checkout(int paymentId, string returnUrl)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not in a valid format.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            payment.RedirectUrl = Url.ActionLink(nameof(Callback), values: new { paymentId, returnUrl });
            await paymentProcessor.ProcessAsync(payment);
            return Result.Succeed(data: new { payment.CheckoutUrl });
        }

        [HttpGet("{paymentId}/callback")]
        public async Task<IActionResult> Callback(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return NotFound();

            await paymentProcessor.VerityAsync(payment);

            var returnUrl = HttpUtility.ParseQueryString(new Uri(payment.RedirectUrl).Query).Get("returnUrl");

            return Redirect(returnUrl);
        }
    }
}