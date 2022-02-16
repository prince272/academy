using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Models.Payments;
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

        [HttpPost("{paymentId}/process")]
        public async Task<IActionResult> Process(int paymentId, PaymentDetailsModel form)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            if (form.IssuerType != null)
            {
                try
                {
                    var issuers = await paymentProcessor.GetIssuersAsync();

                    payment.Details = new PaymentDetails
                    {
                        IssuerType = form.IssuerType.Value,
                        MobileNumber = form.MobileNumber,
                        CardNumber = form.CardNumber,
                        CardExpiry = form.CardExpiry,
                        CardCvv = form.CardCvv,
                    };
                    payment.Details.Resolve(issuers);
                }
                catch (PaymentDetailsException ex)
                {
                    return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.Name, ex.Message));
                }
            }

             payment.RedirectUrl = Url.ActionLink(nameof(ProcessCallback), values: new { paymentId, returnUrl = form.ReturnUrl });
            await paymentProcessor.ProcessAsync(payment);

            return Result.Succeed(data: new
            {
                payment.Title,
                payment.Amount,
                payment.Status,
                payment.CheckoutUrl
            });
        }


        [HttpGet("{paymentId}/process/callback")]
        public async Task<IActionResult> ProcessCallback(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return NotFound();


            if (payment.Status == PaymentStatus.Processing)
            {
                payment.Attempts = Payment.MAX_ATTEMPTS;
                await paymentProcessor.VerityAsync(payment);
            }

            var returnUrl = HttpUtility.ParseQueryString(new Uri(payment.RedirectUrl).Query).Get("returnUrl");

            return Redirect(returnUrl);
        }
    }
}