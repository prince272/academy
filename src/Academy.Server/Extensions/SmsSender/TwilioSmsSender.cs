using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace Academy.Server.Extensions.SmsSender
{
    public class TwilioSmsSender : ISmsSender
    {
        private readonly TwilioSmsSenderOptions smsOptions;

        public TwilioSmsSender(IServiceProvider serviceProvider)
        {
            smsOptions = serviceProvider.GetRequiredService<IOptions<TwilioSmsSenderOptions>>().Value;
        }

        public async Task SendAsync(string phoneNumber, string body, CancellationToken cancellationToken = default)
        {
            TwilioClient.Init(smsOptions.AccountSID, smsOptions.AuthToken);

            var messageOptions = new CreateMessageOptions(
                new PhoneNumber(phoneNumber));
            messageOptions.MessagingServiceSid = smsOptions.MessagingServiceSID;
            messageOptions.Body = body;
            
            var message = await MessageResource.CreateAsync(messageOptions);
        }
    }
}
