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
            if (payment == null)
                throw new ArgumentNullException(nameof(payment));

            payment.Gateway = Name;

            if (payment.Status == PaymentStatus.Pending)
            {
                if (payment.Details != null)
                {
                    if (payment.Details.IssuerType == PaymentIssuerType.Mobile && payment.Type == PaymentType.Debit)
                    {
                        var requestHeaders = new Dictionary<string, string>();
                        var requestData = new Dictionary<string, string>
                                    {
                                        { "merchant_id", paymentOptions.MerchantId },
                                        { "transaction_id", GetTransactionId(payment.Id) },
                                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                                        { "processing_code", "000200" },
                                        { "r-switch", payment.Details.IssuerCode },
                                        { "desc", payment.Title },
                                        { "subscriber_number", payment.Details.MobileNumber.TrimStart('+') },
                                    };

                        httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken).Forget();

                        payment.Status = PaymentStatus.Processing;
                        await unitOfWork.UpdateAsync(payment);
                    }
                    else if (payment.Details.IssuerType == PaymentIssuerType.Mobile && payment.Type == PaymentType.Credit)
                    {
                        var requestHeaders = new Dictionary<string, string>();
                        var requestData = new Dictionary<string, string>
                    {
                        { "merchant_id", paymentOptions.MerchantId },
                        { "transaction_id", GetTransactionId(payment.Id) },
                        { "amount", (payment.Amount * 100).ToString("000000000000") },
                        { "processing_code", "404000" },
                        { "r-switch", "FLT" },
                        { "desc", payment.Title },
                        { "pass_code", paymentOptions.MerchantSecret },
                        { "account_number", payment.Details.MobileNumber.TrimStart('+') },
                        { "account_issuer", payment.Details.IssuerCode },
                    };

                        var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/v1.1/transaction/process", requestData, requestHeaders, cancellationToken);

                        try
                        {
                            var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);
                            payment.Status = (responseData["code"] == "000") ? PaymentStatus.Complete : PaymentStatus.Failed;
                            await unitOfWork.UpdateAsync(payment);
                        }
                        catch (Exception ex)
                        {
                            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                            logger.LogError(ex, responseText);

                            payment.Status = PaymentStatus.Failed;
                            await unitOfWork.UpdateAsync(payment);
                        }
                    }
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

                    try
                    {
                        var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>();

                        payment.Status = (responseData["code"] == "200") ? PaymentStatus.Processing : PaymentStatus.Failed;
                        payment.CheckoutUrl = responseData.GetValueOrDefault("checkout_url");

                        await unitOfWork.UpdateAsync(payment);
                    }
                    catch (Exception ex)
                    {
                        var responseText = await response.Content.ReadAsStringAsync();
                        logger.LogError(ex, responseText);

                        payment.Status = PaymentStatus.Failed;
                        await unitOfWork.UpdateAsync(payment);
                    }
                }
            }
            else if (payment.Status == PaymentStatus.Processing)
            {
                var requestHeaders = new Dictionary<string, string> { { "Merchant-Id", paymentOptions.MerchantId } };
                var response = await httpClient.SendAsJsonAsync(HttpMethod.Get, $"/v1.1/users/transactions/{GetTransactionId(payment.Id)}/status", value: null, headers: requestHeaders, cancellationToken);

                try
                {
                    var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);

                    if (payment.Status == PaymentStatus.Processing)
                    {
                        payment.Status = responseData.GetValueOrDefault("code") == "000" ? PaymentStatus.Complete : PaymentStatus.Failed;
                        payment.Completed = DateTimeOffset.UtcNow;

                        await unitOfWork.UpdateAsync(payment);
                    }
                }
                catch (Exception ex)
                {
                    var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                    logger.LogError(ex, responseText);
                }
            }
        }

        public async Task VerityAsync(Payment payment, CancellationToken cancellationToken)
        {
            if (payment == null)
                throw new ArgumentNullException(nameof(payment));

            if ((++payment.Attempts) > Payment.MAX_ATTEMPTS)
            {
                payment.Status = PaymentStatus.Failed;
            }
            else
            {
                try
                {
                    var requestHeaders = new Dictionary<string, string>();
                    var requestData = new Dictionary<string, string>();
                    var response = await httpClient.SendAsJsonAsync(HttpMethod.Get, $"/v1.1/users/transactions/{GetTransactionId(payment.Id)}/status", requestData, requestHeaders, cancellationToken);
                    response.EnsureSuccessStatusCode();
                    var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, string>>(cancellationToken);

                    if (responseData.GetValueOrDefault("code") == "000")
                        payment.Status = PaymentStatus.Complete;

                    else if (payment.Attempts == Payment.MAX_ATTEMPTS) payment.Status = PaymentStatus.Failed;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, $"Something went wrong while verifying payment with the Id: {payment.Id}.");
                }
            }

            await unitOfWork.UpdateAsync(payment);
        }

        public Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken)
        {
            var issuers = new PaymentIssuer[]
            {
                new PaymentIssuer(PaymentIssuerType.Mobile, "MTN", "^(24|54|55|59)", "MTN"),
                new PaymentIssuer(PaymentIssuerType.Mobile, "VDF", "^(20|50)", "Vodafone"),
                new PaymentIssuer(PaymentIssuerType.Mobile, "ATL", "^(27|57|26|56)", "AirtelTigo"),

                new PaymentIssuer(PaymentIssuerType.Card, "VIS", @"^4[0-9]{12}(?:[0-9]{3})?$", "Visa"),
                new PaymentIssuer(PaymentIssuerType.Card, "MAS", @"^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$", "MasterCard"),
            };
            return Task.FromResult(issuers);
        }

        private string GetTransactionId(int paymentId)
        {
            return $"{paymentId:D12}";
        }
    }

    public class PaySwitchPaymentHostedService : BackgroundService
    {
        private readonly IServiceProvider services;
        private readonly ILogger<PaySwitchPaymentHostedService> logger;
        private int executionCount = 0;
        private bool executionError;

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

            using (var scope = services.CreateScope())
            {
                var serviceProvider = scope.ServiceProvider;
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var paymentProcessor = serviceProvider.GetRequiredService<IPaymentProcessor>();

                while (!cancellationToken.IsCancellationRequested)
                {
                    executionCount += 1;

                    try
                    {
                        var payments = await unitOfWork.Query<Payment>().Where(_ => _.Status == PaymentStatus.Processing).ToListAsync(cancellationToken);

                        foreach (var payment in payments)
                        {
                            await paymentProcessor.VerityAsync(payment, cancellationToken);
                        }

                        executionError = false;
                    }
                    catch (Exception ex)
                    {
                        if (executionError)
                        {
                            logger.LogError(ex, $"{nameof(PaySwitchPaymentHostedService)} throw an exception.");
                        }

                        executionError = true;
                    }

                    await Task.Delay(5000, cancellationToken);
                }
            }

        }
    }
}