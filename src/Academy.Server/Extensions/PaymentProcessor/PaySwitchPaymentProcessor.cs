using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Events;
using Academy.Server.Utilities;
using Humanizer;
using MediatR;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhoneNumbers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public class PaySwitchPaymentProcessor : IPaymentProcessor
    {
        private readonly PaySwitchPaymentOptions paymentOptions;
        private readonly HttpClient httpClient;
        private readonly ILogger<PaySwitchPaymentProcessor> logger;
        private readonly IUnitOfWork unitOfWork;
        private readonly IMediator mediator;
        private readonly AppSettings appSettings;

        public PaySwitchPaymentProcessor(IServiceProvider serviceProvider)
        {
            paymentOptions = serviceProvider.GetRequiredService<IOptions<PaySwitchPaymentOptions>>().Value;

            httpClient = serviceProvider.GetRequiredService<IHttpClientFactory>().CreateClient(nameof(PaySwitchPaymentProcessor));
            httpClient.BaseAddress = new Uri("https://prod.theteller.net");
            var authenticationToken = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{paymentOptions.ClientId}:{paymentOptions.ClientSecret}"));
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authenticationToken);
            httpClient.DefaultRequestHeaders.Add("Merchant-Id", paymentOptions.MerchantId);
            logger = serviceProvider.GetRequiredService<ILogger<PaySwitchPaymentProcessor>>();
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            mediator = serviceProvider.GetRequiredService<IMediator>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }

        public string Gateway => "PaySwitch";

        public async Task ProcessAsync(Payment payment, PaymentDetails paymentDetails, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));
            if (paymentDetails == null) throw new ArgumentNullException(nameof(paymentDetails));

            payment.Gateway = Gateway;
            payment.TransactionId = GenerateTransactionId();
            payment.Mode = paymentDetails.Mode;

            if (payment.Type == PaymentType.Payin)
            {
                if (payment.Mode == PaymentMode.Mobile)
                {
                    var requestHeaders = new Dictionary<string, string>();
                    var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", payment.TransactionId },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "000200" },
                                        { "r-switch", paymentDetails.Issuer.Code },
                                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                                        { "subscriber_number", paymentDetails.Number.TrimStart('+') },
                                    };

                    try
                    {
                        var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken)
                              .TimeoutAfter(TimeSpan.FromSeconds(5));
                        var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();
                    }
                    catch (TimeoutException)
                    {
                        payment.Status = PaymentStatus.Processing;
                        payment.Processing = DateTimeOffset.UtcNow;
                        await unitOfWork.UpdateAsync(payment);
                        return;
                    }
                    catch
                    {
                        throw;
                    }
                }
                else if (payment.Mode == PaymentMode.External)
                {
                    var requestHeaders = new Dictionary<string, string>();
                    var requestData = new Dictionary<string, string>
                    {
                        { "merchant_id", paymentOptions.MerchantId },
                        { "transaction_id", payment.TransactionId },
                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                        { "redirect_url", payment.RedirectUrl },
                        { "email", appSettings.Company.Emails.App.Email },
                    };

                    var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "https://checkout.theteller.net/initiate", requestData, requestHeaders, cancellationToken);
                    var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                    if (responseData["code"] != "200")
                    {
                        payment.Status = PaymentStatus.Processing;
                        payment.Processing = DateTimeOffset.UtcNow;
                        payment.RedirectUrl = responseData.GetValueOrDefault("checkout_url");
                        await unitOfWork.UpdateAsync(payment);
                        return;
                    }
                }
            }
            else if (payment.Type == PaymentType.Payout)
            {
                if (payment.Mode == PaymentMode.Mobile)
                {
                    var requestHeaders = new Dictionary<string, string>();
                    var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", payment.TransactionId },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "404000" },
                                        { "r-switch", "FLT" },
                                        { "pass_code", paymentOptions.MerchantSecret },
                                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                                        { "account_number", paymentDetails.Number.TrimStart('+') },
                                        { "account_issuer", paymentDetails.Issuer.Code },
                                    };

                    var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken);
                    var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                    if (responseData["code"] == "000")
                    {
                        payment.Status = PaymentStatus.Succeeded;
                        payment.Completed = DateTimeOffset.UtcNow;
                        await unitOfWork.UpdateAsync(payment);
                        await mediator.Publish(new PaymentStatusNotification(payment), cancellationToken);
                        return;
                    }
                }
            }

            throw new InvalidOperationException("Unable to process payment.");
        }

        public async Task VerifyAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            var maxInMinutes = 1;

            try
            {
                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>();
                var response = await httpClient.SendAsJsonAsync(HttpMethod.Get, $"/v1.1/users/transactions/{payment.TransactionId}/status", requestData, requestHeaders, cancellationToken);
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);

                if (responseData.GetValueOrDefault("code") == "000")
                {
                    payment.Status = PaymentStatus.Succeeded;
                    payment.Completed = DateTimeOffset.UtcNow;
                    payment.ReturnUrl = QueryHelpers.AddQueryString(payment.ReturnUrl, "status", payment.Status.ToString().Camelize());
                    await unitOfWork.UpdateAsync(payment);
                    await mediator.Publish(new PaymentStatusNotification(payment), cancellationToken);
                }
                else
                {
                    throw new InvalidOperationException("Unable to verify payment.");
                }
            }
            catch (Exception)
            {
                if ((DateTimeOffset.UtcNow - payment.Issued) >= TimeSpan.FromMinutes(maxInMinutes))
                {
                    payment.Status = PaymentStatus.Failed;
                    payment.Completed = DateTimeOffset.UtcNow;
                    payment.ReturnUrl = QueryHelpers.AddQueryString(payment.ReturnUrl, "status", payment.Status.ToString().Camelize());
                    await unitOfWork.UpdateAsync(payment);
                    await mediator.Publish(new PaymentStatusNotification(payment), cancellationToken);
                }
            }
        }

        public Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken = default)
        {
            var issuers = new PaymentIssuer[]
            {
                new PaymentIssuer("MTN", "^233(24|54|55|59)", "MTN", PaymentMode.Mobile),
                new PaymentIssuer("VDF", "^233(20|50)", "Vodafone", PaymentMode.Mobile),
                new PaymentIssuer("ATL", "^233(27|57|26|56)", "AirtelTigo", PaymentMode.Mobile)
            };
            return Task.FromResult(issuers);
        }

        private string GenerateTransactionId() => Compute.GenerateNumber(12);
    }

    public class PaymentDetails
    {
        public static PaymentDetails SetMobileDetails(PaymentIssuer[] mobileIssuers, string mobileNumber)
        {
            if (string.IsNullOrWhiteSpace(mobileNumber))
                throw new ArgumentException("'Mobile number' must not be empty.", nameof(mobileNumber));

            PhoneNumber mobileNumberInfo = null;

            var mobileUtil = PhoneNumberUtil.GetInstance();
            if (!mobileUtil.IsValidNumber(mobileNumberInfo = mobileUtil.Parse(mobileNumber, null)))
                throw new ArgumentException("'Mobile number' is not valid.", nameof(mobileNumber));

            var mobileIssuer = mobileIssuers.FirstOrDefault(_ => Regex.IsMatch($"{mobileNumberInfo.CountryCode}{mobileNumberInfo.NationalNumber}", _.Pattern));
            if (mobileIssuer == null) throw new ArgumentException($"'Mobile number' is not supported by any of these mobile issuers. {mobileIssuers.Select(_ => _.Name).Humanize()}", nameof(mobileNumber));

            var paymentDetails = new PaymentDetails();
            paymentDetails.Issuer = mobileIssuer;
            paymentDetails.Number = mobileNumber;
            paymentDetails.Mode = PaymentMode.Mobile;
            return paymentDetails;
        }

        public static PaymentDetails SetExternalDetails()
        {
            var paymentDetails = new PaymentDetails();
            paymentDetails.Mode = PaymentMode.Mobile;
            return paymentDetails;
        }

        public PaymentDetails()
        {

        }

        public PaymentMode Mode { get; set; }

        public string Number { get; set; }

        public PaymentIssuer Issuer { get; set; }
    }

    public class PaymentIssuer
    {
        public PaymentIssuer(string code, string pattern, string name, PaymentMode mode)
        {
            Code = code;
            Pattern = pattern;
            Name = name;
            Mode = mode;
        }

        public string Code { get; set; }

        public string Pattern { get; set; }

        public string Name { get; set; }

        public PaymentMode Mode { get; set; }
    }
}