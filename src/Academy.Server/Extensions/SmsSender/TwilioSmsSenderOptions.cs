namespace Academy.Server.Extensions.SmsSender
{
    public class TwilioSmsSenderOptions
    {
        public string AccountSID { get; set; }

        public string AuthToken { get; set; }

        public string MessagingServiceSID { get; set; }
    }
}
