using Academy.Server.Data;
using Academy.Server.Data.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public class PaymentStatusHandler : INotificationHandler<PaymentNotification>
    {
        private readonly IUnitOfWork unitOfWork;

        public PaymentStatusHandler(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
        }

        public async Task Handle(PaymentNotification notification, CancellationToken cancellationToken)
        {
            var payment = notification.Payment;

            if (payment.Status == PaymentStatus.Complete && payment.Reason == PaymentReason.Course)
            {
                var course = unitOfWork.Query<Course>()
                    .Include(_ => _.User)
                    .FirstOrDefault(_ => _.Id == payment.ReasonId);

                if (course != null)
                {
                    var user = course.User;
                    user.Balance += course.Cost;
                    await unitOfWork.UpdateAsync(user);
                }
            }
        }
    }
}
