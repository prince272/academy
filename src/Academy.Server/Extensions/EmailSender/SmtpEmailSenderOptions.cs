namespace Academy.Server.Extensions.EmailSender
{
    public class SmtpEmailSenderOptions
    {
        public bool UseServerCertificateValidation { get; set; }

        public int SecureSocketOptionsId { get; set; }

        public string Hostname { get; set; }

        public int Port { get; set; }
    }
}
