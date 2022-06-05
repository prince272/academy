using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public class PaySwitchPaymentHostedService : BackgroundService
    {
        private readonly IServiceProvider services;
        private readonly ILogger<PaySwitchPaymentHostedService> logger;
        private long executionCount = 0;
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
                            await paymentProcessor.VerifyAsync(payment, cancellationToken);
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

                    await Task.Delay(2000, cancellationToken);
                }
            }

        }
    }
}
