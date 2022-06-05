using Academy.Server.Data.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public interface IPaymentProcessor
    {
        Task ProcessAsync(Payment payment, PaymentDetails paymentDetails, CancellationToken cancellationToken = default);

        Task VerifyAsync(Payment payment, CancellationToken cancellationToken = default);

        Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken = default);
    }
}