using System.Threading.Tasks;

namespace Academy.Server.Extensions.SmsSender
{
    public class SmsSender : ISmsSender
    {
        public Task SendAsync(string phoneNumber, string message)
        {
            throw new System.NotImplementedException();
        }
    }
}
