﻿using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.SmsSender
{
    public interface ISmsSender
    {
        Task SendAsync(string phoneNumber, string body, CancellationToken cancellationToken = default);
    }
}
