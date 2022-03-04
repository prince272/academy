﻿using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Models.Payments;
using Academy.Server.Utilities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
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

        [HttpPost("{paymentId}/mobile/charge")]
        public async Task<IActionResult> ChargeMobile(int paymentId, string returnUrl, [FromBody] MobileChargeModel form)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            try
            {
                var mobileIssuers = (await paymentProcessor.GetIssuersAsync()).Where(_ => _.Type == PaymentIssuerType.Mobile).ToArray();
                payment.SetData(nameof(MobileDetails), new MobileDetails(mobileIssuers, form.MobileNumber));
            }
            catch (PaymentDetailsException ex) { return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.Name, ex.Message)); }

            payment.RedirectUrl = Url.ActionLink(nameof(Verify), values: new { paymentId, returnUrl });
            await paymentProcessor.ChargeAsync(payment);
            return Result.Succeed();
        }

        [HttpPost("{paymentId}/charge")]
        public async Task<IActionResult> Charge(int paymentId, string returnUrl)
        {
            if (!Uri.IsWellFormedUriString(returnUrl, UriKind.Absolute))
                throw new ArgumentException("Url is not valid.", nameof(returnUrl));

            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return Result.Failed(StatusCodes.Status404NotFound);

            payment.RedirectUrl = Url.ActionLink(nameof(Verify), values: new { paymentId, returnUrl });
            await paymentProcessor.ChargeAsync(payment);
            return Result.Succeed(data: new { payment.CheckoutUrl });
        }

        [HttpGet("{paymentId}/verify")]
        public async Task<IActionResult> Verify(int paymentId)
        {
            var query = unitOfWork.Query<Payment>();
            var payment = await query.FirstOrDefaultAsync(_ => _.Id == paymentId);
            if (payment == null) return NotFound();

            await paymentProcessor.VerifyAsync(payment);

            var returnUrl = HttpUtility.ParseQueryString(new Uri(payment.RedirectUrl).Query).Get("returnUrl");

            return Redirect(returnUrl);
        }
    }
}