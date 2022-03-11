﻿using System.Threading.Tasks;

namespace Academy.Server.Extensions.SmsSender
{
    public interface ISmsSender
    {
        Task SendAsync(string phoneNumber, string message);
    }
}