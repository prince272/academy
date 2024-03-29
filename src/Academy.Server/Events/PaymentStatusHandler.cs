﻿using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.SmsSender;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Utilities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Events
{
    public class PaymentStatusNotification : INotification
    {
        public PaymentStatusNotification(Payment payment)
        {
            Payment = payment;
        }

        public Payment Payment { get; set; }
    }

    public class PaymentStatusHandler : INotificationHandler<PaymentStatusNotification>
    {
        private readonly AppSettings appSettings;
        private readonly IUnitOfWork unitOfWork;
        private readonly IEmailSender emailSender;
        private readonly ISmsSender smsSender;
        private readonly IViewRenderer viewRenderer;

        public PaymentStatusHandler(IServiceProvider serviceProvider)
        {
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            smsSender = serviceProvider.GetRequiredService<ISmsSender>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }

        public async Task Handle(PaymentStatusNotification notification, CancellationToken cancellationToken)
        {
            var payment = notification.Payment;

            if (payment.Status == PaymentStatus.Succeeded)
            {
                if (payment.Reason == PaymentReason.Course)
                {
                    var course = unitOfWork.Query<Course>()
                        .Include(_ => _.Teacher)
                        .FirstOrDefault(_ => _.Code == payment.Code);

                    if (course != null)
                    {
                        var user = course.Teacher;
                        user.Balance += course.Cost;
                        await unitOfWork.UpdateAsync(user);
                    }
                }
                else if (payment.Reason == PaymentReason.Withdrawal)
                {
                    var user = await unitOfWork.Query<User>()
                        .FirstOrDefaultAsync(_ => _.Code == payment.Code);

                    if (user != null)
                    {
                        user.Balance -= payment.Amount;
                        await unitOfWork.UpdateAsync(user);
                    }
                }
                else if (payment.Reason == PaymentReason.Sponsorship)
                {
                    var user = await unitOfWork.Query<User>()
                        .FirstOrDefaultAsync(_ => _.Code == payment.Code);

                    if (user != null)
                    {
                        user.Balance += payment.Amount;
                        await unitOfWork.UpdateAsync(user);
                    }

                    if (payment.Email != null)
                        (emailSender.SendAsync(account: appSettings.Company.Emails.Info, address: new EmailAddress { Email = payment.Email },
                           subject: "Your Sponsorship Has Been Received",
                           body: await viewRenderer.RenderToStringAsync("Email/SponsorshipReceived", payment))).Forget();

                    if (payment.PhoneNumber != null)
                        (smsSender.SendAsync(payment.PhoneNumber, Sanitizer.StripHtml(await viewRenderer.RenderToStringAsync("Sms/SponsorshipReceived", payment)))).Forget();
                }
            }
        }
    }
}