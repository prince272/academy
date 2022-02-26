using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using Humanizer;
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
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }

        public string Name => "PaySwitch";

        public async Task ProcessAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            if (payment.GetData<MobileDetails>(nameof(MobileDetails)) is MobileDetails mobileDetails)
            {
                var mobileIssuers = await GetMobileIssuersAsync(cancellationToken);

                if (string.IsNullOrWhiteSpace(mobileDetails.MobileNumber))
                    throw new MobileDetailsException(nameof(mobileDetails.MobileNumber), "'Mobile number' must not be empty.");

                PhoneNumber mobileNumberInfo = null;

                try
                {
                    var mobileUtil = PhoneNumberUtil.GetInstance();
                    if (!mobileUtil.IsValidNumber(mobileNumberInfo = mobileUtil.Parse(mobileDetails.MobileNumber, null)))
                        throw new MobileDetailsException(nameof(mobileDetails.MobileNumber), "'Mobile number' is not valid.");
                }
                catch (NumberParseException)
                {
                    throw new MobileDetailsException(nameof(mobileDetails.MobileNumber), "'Mobile number' is not valid.");
                }

                var mobileIssuer = mobileIssuers.FirstOrDefault(_ => Regex.IsMatch($"{mobileNumberInfo.CountryCode}{mobileNumberInfo.NationalNumber}", _.Pattern));
                if (mobileIssuer == null) throw new MobileDetailsException(nameof(mobileDetails.MobileNumber), $"'Mobile number' is not supported by any of these mobile issuers. {mobileIssuers.Select(_ => _.Name).Humanize()}");
                mobileDetails.MobileIssuer = mobileIssuer;

                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", GetTransactionId(payment.Id) },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "000200" },
                                        { "r-switch", mobileIssuer.Code },
                                        { "desc", payment.Title },
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
                        { "transaction_id", GetTransactionId(payment.Id) },
                        { "desc", payment.Title },
                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                        { "redirect_url", payment.RedirectUrl },
                        { "email", appSettings.Company.Email },
                        { "API_Key", paymentOptions.ClientSecret },
                        { "apiuser", paymentOptions.ClientId },
                    };

                var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/checkout/initiate", requestData, requestHeaders, cancellationToken);
                response.EnsureSuccessStatusCode();

                Dictionary<string, string> responseData = null;

                try { responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(); }
                catch (Exception ex) { logger.LogError(ex, await response.Content.ReadAsStringAsync()); throw; }


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

        public async Task VerityAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            if (payment == null) throw new ArgumentNullException(nameof(payment));

            var maxVerityInMinutes = 15;

            if (payment.Status == PaymentStatus.Processing)
            {
                if ((DateTimeOffset.UtcNow - payment.Issued) >= TimeSpan.FromMinutes(maxVerityInMinutes))
                {
                    payment.Status = PaymentStatus.Failed;
                    await unitOfWork.UpdateAsync(payment);
                    return;
                }

                var requestHeaders = new Dictionary<string, string>();
                var requestData = new Dictionary<string, string>();
                var response = await httpClient.SendAsJsonAsync(HttpMethod.Get, $"/v1.1/users/transactions/{GetTransactionId(payment.Id)}/status", requestData, requestHeaders, cancellationToken);
                response.EnsureSuccessStatusCode();
                var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);

                if (responseData.GetValueOrDefault("code") == "000")
                {
                    payment.Status = PaymentStatus.Complete;
                    await unitOfWork.UpdateAsync(payment);
                }
            }
            else if (payment.Status == PaymentStatus.Pending)
            {
                if ((DateTimeOffset.UtcNow - payment.Issued) >= TimeSpan.FromMinutes(maxVerityInMinutes))
                {
                    payment.Status = PaymentStatus.Failed;
                    await unitOfWork.UpdateAsync(payment);
                    return;
                }
            }
        }


        private Task<MobileIssuer[]> GetMobileIssuersAsync(CancellationToken cancellationToken = default)
        {
            var issuers = new MobileIssuer[]
            {
                new MobileIssuer("MTN", "^233(24|54|55|59)", "MTN"),
                new MobileIssuer("VDF", "^233(20|50)", "Vodafone"),
                new MobileIssuer("ATL", "^233(27|57|26|56)", "AirtelTigo")
            };
            return Task.FromResult(issuers);
        }

        private string GetTransactionId(int paymentId)
        {
            return $"{paymentId:D13}";
        }
    }

    public class PaySwitchPaymentHostedService : BackgroundService
    {
        private readonly IServiceProvider services;
        private readonly ILogger<PaySwitchPaymentHostedService> logger;
        private int executionCount = 0;
        private bool errorLogged;

        public PaySwitchPaymentHostedService(IServiceProvider serviceProvider,
            ILogger<PaySwitchPaymentHostedService> logger)
        {
            services = serviceProvider;
            this.logger = logger;
        }

        public override Task StartAsync(CancellationToken cancellationToken)
        {
            logger.LogInformation($"{nameof(PaySwitchPaymentHostedService)} has started.");
            return base.StartAsync(cancellationToken);
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            logger.LogCritical($"{nameof(PaySwitchPaymentHostedService)} has stopped.");
            return base.StopAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            logger.LogInformation($"{nameof(PaySwitchPaymentHostedService)} is running.");

            while (!cancellationToken.IsCancellationRequested)
            {
                using (var scope = services.CreateScope())
                {
                    var serviceProvider = scope.ServiceProvider;
                    var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                    var paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();


                    executionCount += 1;

                    try
                    {
                        var payments = await unitOfWork.Query<Payment>()
                            .Where(_ => _.Status == PaymentStatus.Pending || _.Status == PaymentStatus.Processing)
                            .ToListAsync(cancellationToken);

                        foreach (var payment in payments)
                        {
                            await paymentProcessor.VerityAsync(payment, cancellationToken);
                        }

                        errorLogged = false;
                    }
                    catch (Exception ex)
                    {
                        if (!errorLogged)
                        {
                            logger.LogError(ex, $"{nameof(PaySwitchPaymentHostedService)} throw an exception.");
                        }

                        errorLogged = true;
                    }

                    await Task.Delay(10000, cancellationToken);
                }
            }

        }
    }

    public class MobileDetails
    {
        public string MobileNumber { get; set; }

        public MobileIssuer MobileIssuer { get; set; }
    }

    [Serializable]
    public class MobileDetailsException : Exception
    {

        public MobileDetailsException(string name, string message) : base(message)
        {
            Name = name;
        }

        public string Name { get; set; }
    }

    public class MobileIssuer
    {
        public MobileIssuer(string code, string pattern, string name)
        {
            Code = code;
            Pattern = pattern;
            Name = name;
        }

        public string Code { get; set; }

        public string Pattern { get; set; }

        public string Name { get; set; }
    }
}