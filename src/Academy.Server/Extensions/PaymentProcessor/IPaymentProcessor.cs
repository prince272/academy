using Academy.Server.Data.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.PaymentProcessor
{
    public interface IPaymentProcessor
    {
        string Name { get; }

        Task ProcessAsync(Payment payment, CancellationToken cancellationToken = default);

        Task VerityAsync(Payment payment, CancellationToken cancellationToken = default);
    }
}
