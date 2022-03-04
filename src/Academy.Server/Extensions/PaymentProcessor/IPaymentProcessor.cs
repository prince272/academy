using Academy.Server.Data.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public interface IPaymentProcessor
    {
        string Name { get; }

        Task TransferAsync(Payment payment, CancellationToken cancellationToken = default);

        Task ChargeAsync(Payment payment, CancellationToken cancellationToken = default);

        Task VerifyAsync(Payment payment, CancellationToken cancellationToken = default);

        Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken = default);
    }
}