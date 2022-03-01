using Academy.Server.Data.Entities;
using MediatR;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public class PaymentNotification : INotification
    {
        public PaymentNotification(Payment payment)
        {
            Payment = payment;
        }

        public Payment Payment { get; set; }
    }
}
