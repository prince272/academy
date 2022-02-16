namespace Academy.Server.Extensions.PaymentProcessor
{
    public class PaySwitchPaymentOptions
    {
        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public string MerchantId { get; set; }

        public string MerchantSecret { get; set; }
    }
}
