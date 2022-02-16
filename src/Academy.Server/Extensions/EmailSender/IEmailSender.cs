using System.Threading.Tasks;

namespace Academy.Server.Extensions.EmailSender
{
    public interface IEmailSender
    {
        Task SendAsync(EmailAccount account, EmailAddress address, string subject, string body);
    }
}