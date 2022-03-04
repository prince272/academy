using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using Humanizer;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhoneNumbers;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

        public string Name => "PaySwitch";

        public async Task TransferAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            if (payment.Status != PaymentStatus.Pending)
                throw new InvalidOperationException($"The payment with the id of '{payment.Id}' cannot be processed because it is not in a pending state. Status: {payment.Status}");

            payment.Gateway = Name;
            payment.TransactionId = GenerateTransactionId();
            payment.Type = PaymentType.Credit;

            await unitOfWork.CreateAsync(payment);

            if (payment.GetData<MobileDetails>(nameof(MobileDetails)) is MobileDetails mobileDetails)
            {
                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", payment.TransactionId },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "404000" },
                                        { "r-switch", "FLT" },
                                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                                        { "account_number", mobileDetails.MobileNumber.TrimStart('+') },
                                        { "account_issuer", mobileDetails.MobileIssuer.Code },
                                    };

                var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken);
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                if (responseData["code"] == "000")
                {
                    payment.Status = PaymentStatus.Complete;
                    await unitOfWork.UpdateAsync(payment);
                }
                else
                {
                    throw new InvalidOperationException("Unable to transfer payment.");
                }
            }
            else
            {
                throw new InvalidOperationException();
            }
        }

        public async Task ChargeAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            if (payment.Status != PaymentStatus.Pending)
                throw new InvalidOperationException($"The payment with the id of '{payment.Id}' cannot be processed because it is not in a pending state. Status: {payment.Status}");

            payment.Gateway = Name;
            payment.TransactionId = GenerateTransactionId();
            payment.Type = PaymentType.Debit;

            if (payment.GetData<MobileDetails>(nameof(MobileDetails)) is MobileDetails mobileDetails)
            {
                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", payment.TransactionId },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "000200" },
                                        { "r-switch", mobileDetails.MobileIssuer.Code },
                                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                                        { "subscriber_number", mobileDetails.MobileNumber.TrimStart('+') },
                                    };

                httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken).Forget();

                payment.SetData(nameof(MobileDetails), mobileDetails);
                payment.Status = PaymentStatus.Processing;
                await unitOfWork.UpdateAsync(payment);
            }
            else
            {
                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>
                    {
                        { "merchant_id", paymentOptions.MerchantId },
                        { "transaction_id", payment.TransactionId },
                        { "desc", $"Payment of {payment.Reason.Humanize()}" },
                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                        { "redirect_url", payment.RedirectUrl },
                        { "email", appSettings.Company.Email },
                    };


                var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "https://checkout.theteller.net/initiate", requestData, requestHeaders, cancellationToken);
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                if (responseData["code"] == "200")
                {
                    payment.Status = PaymentStatus.Processing;
                    payment.CheckoutUrl = responseData.GetValueOrDefault("checkout_url");
                    await unitOfWork.UpdateAsync(payment);
                }
                else
                {
                    throw new InvalidOperationException("Unable to process payment.");
                }
            }
        }

        public async Task VerifyAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            var maxVerityInMinutes = 5;

            if (payment.Status == PaymentStatus.Processing)
            {
                if ((DateTimeOffset.UtcNow - payment.Issued) >= TimeSpan.FromMinutes(maxVerityInMinutes))
                {
                    payment.Status = PaymentStatus.Failed;
                    await unitOfWork.UpdateAsync(payment);
                    await mediator.Publish(new PaymentNotification(payment), cancellationToken);
                    return;
                }

                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>();
                var response = await httpClient.SendAsJsonAsync(HttpMethod.Get, $"/v1.1/users/transactions/{payment.TransactionId}/status", requestData, requestHeaders, cancellationToken);
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);

                if (responseData.GetValueOrDefault("code") == "000")
                {
                    payment.Status = PaymentStatus.Complete;
                    payment.Completed = DateTimeOffset.UtcNow;
                    await unitOfWork.UpdateAsync(payment);
                    await mediator.Publish(new PaymentNotification(payment), cancellationToken);
                }
            }
            else if (payment.Status == PaymentStatus.Pending)
            {
                if ((DateTimeOffset.UtcNow - payment.Issued) >= TimeSpan.FromMinutes(maxVerityInMinutes))
                {
                    payment.Status = PaymentStatus.Failed;
                    await unitOfWork.UpdateAsync(payment);
                    await mediator.Publish(new PaymentNotification(payment), cancellationToken);
                    return;
                }
            }
        }

        public Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken = default)
        {
            var issuers = new PaymentIssuer[]
            {
                new PaymentIssuer("MTN", "^233(24|54|55|59)", "MTN", PaymentIssuerType.Mobile),
                new PaymentIssuer("VDF", "^233(20|50)", "Vodafone", PaymentIssuerType.Mobile),
                new PaymentIssuer("ATL", "^233(27|57|26|56)", "AirtelTigo", PaymentIssuerType.Mobile)
            };
            return Task.FromResult(issuers);
        }

        private string GenerateTransactionId() => Compute.GenerateNumber(12);
    }

    public class MobileDetails
    {
        public MobileDetails(PaymentIssuer[] issuers, string number)
        {
            MobileNumber = number;

            if (string.IsNullOrWhiteSpace(MobileNumber))
                throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' must not be empty.");

            PhoneNumber mobileNumberInfo = null;

            try
            {
                var mobileUtil = PhoneNumberUtil.GetInstance();
                if (!mobileUtil.IsValidNumber(mobileNumberInfo = mobileUtil.Parse(MobileNumber, null)))
                    throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' is not valid.");
            }
            catch (NumberParseException)
            {
                throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' is not valid.");
            }

            var mobileIssuer = issuers.FirstOrDefault(_ => Regex.IsMatch($"{mobileNumberInfo.CountryCode}{mobileNumberInfo.NationalNumber}", _.Pattern));
            if (mobileIssuer == null) throw new PaymentDetailsException(nameof(MobileNumber), $"'Mobile number' is not supported by any of these mobile issuers. {issuers.Select(_ => _.Name).Humanize()}");
            MobileIssuer = mobileIssuer;
        }

        public string MobileNumber { get; set; }

        public PaymentIssuer MobileIssuer { get; set; }
    }

    [Serializable]
    public class PaymentDetailsException : Exception
    {
        public PaymentDetailsException(string name, string message) : base(message)
        {
            Name = name;
        }

        public string Name { get; set; }
    }

    public class PaymentIssuer
    {
        public PaymentIssuer(string code, string pattern, string name, PaymentIssuerType type)
        {
            Code = code;
            Pattern = pattern;
            Name = name;
            Type = type;
        }

        public string Code { get; set; }

        public string Pattern { get; set; }

        public string Name { get; set; }

        public PaymentIssuerType Type { get; set; }
    }

    public enum PaymentIssuerType
    {
        Mobile
    }
}