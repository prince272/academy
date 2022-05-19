using Academy.Server.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.SmsSender
{
    public class mNotifySmsSender : ISmsSender
    {
        private readonly HttpClient httpClient;
        private readonly mNotifySmsSenderOptions smsOptions;

        public mNotifySmsSender(IServiceProvider serviceProvider)
        {
            httpClient = serviceProvider.GetRequiredService<IHttpClientFactory>().CreateClient(nameof(mNotifySmsSender));
            httpClient.BaseAddress = new Uri("https://api.mnotify.com");
            smsOptions = serviceProvider.GetRequiredService<IOptions<mNotifySmsSenderOptions>>().Value;
        }

        public async Task SendAsync(string phoneNumber, string body, CancellationToken cancellationToken = default)
        {
            var requestHeaders = new Dictionary<string, string>();
            var requestData =  new Dictionary<string, object>
                                    {
                                        { "key", smsOptions.ClientSecret },
                                        { "recipient", new [] { phoneNumber.TrimStart('+') } },
                                        { "sender", smsOptions.ClientId },
                                        { "message", body },
                                    };
            var response = await httpClient.SendAsJsonAsync(HttpMethod.Post, "/api/sms/quick", requestData, requestHeaders, cancellationToken);
            var responseData = await response.Content.ReadAsJsonAsync<Dictionary<string, object>>();
            if (responseData["status"] is string status && status != "success")
                throw new InvalidOperationException("Unable to send message.");
        }
    }
}