using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MimeKit;
using System;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.EmailSender
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpEmailSenderOptions emailSenderOptions;

        public SmtpEmailSender(IServiceProvider serviceProvider)
        {
            emailSenderOptions = serviceProvider.GetRequiredService<IOptions<SmtpEmailSenderOptions>>().Value;
        }

        public async Task SendAsync(EmailAccount account, EmailAddress address, string subject, string body)
        {
            var message = new MimeMessage();

            message.Subject = subject;
            message.From.Add(new MailboxAddress(account.DisplayName, account.Email));
            message.To.Add(new MailboxAddress(string.Empty, address.Email));

            var builder = new BodyBuilder();
            builder.HtmlBody = body;

            message.Body = builder.ToMessageBody();

            using (var smtpClient = new SmtpClient())
            {
                smtpClient.ServerCertificateValidationCallback = (s, c, h, e) => emailSenderOptions.UseServerCertificateValidation;
                await smtpClient.ConnectAsync(emailSenderOptions.Hostname, emailSenderOptions.Port, (SecureSocketOptions)emailSenderOptions.SecureSocketOptionsId);
                await smtpClient.AuthenticateAsync(account.Username, account.Password);
                await smtpClient.SendAsync(message);
                await smtpClient.DisconnectAsync(true);
            }
        }
    }

    public class EmailAddress
    {
        public string Email { get; set; }
    }

    public class EmailAccount : EmailAddress
    {
        public string Username { get; set; }

        public string Password { get; set; }

        public string DisplayName { get; set; }
    }
}
