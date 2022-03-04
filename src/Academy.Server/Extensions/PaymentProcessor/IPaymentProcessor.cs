using Academy.Server.Data.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public interface IPaymentProcessor
    {
        string Name { get; }

        Task CashoutAsync(Payment payment, CancellationToken cancellationToken = default);

        Task CashinAsync(Payment payment, CancellationToken cancellationToken = default);

        Task ConfirmAsync(Payment payment, CancellationToken cancellationToken = default);

        Task<PaymentIssuer[]> GetIssuersAsync(CancellationToken cancellationToken = default);
    }
}