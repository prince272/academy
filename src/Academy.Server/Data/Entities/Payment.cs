using Humanizer;
using PhoneNumbers;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.RegularExpressions;

namespace Academy.Server.Data.Entities
{
    public class Payment : IEntity, IExtendable
    {
        public string ContactName { get; set; }

        public string ContactInfo { get; set; }

        public int? UserId { get; set; }

        public int Id { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentType Type { get; set; }

        public string Gateway { get; set; }

        public PaymentMode Mode { get; set; }

        public PaymentDetails Details { get; set; }

        public decimal Amount { get; set; }

        public string Title { get; set; }

        public string IpAddress { get; set; }

        public DateTimeOffset? Completed { get; set; }

        public string ExtensionData { get; set; }

        public string UAString { get; set; }

        public string CheckoutUrl { get; set; }

        public string RedirectUrl { get; set; }

        public int Attempts { get; set; }

        public const int MAX_ATTEMPTS = 200;
    }

    public class PaymentDetails
    {
        public string IssuerName { get; set; }

        public string IssuerCode { get; set; }

        public PaymentIssuerType IssuerType { get; set; }

        public string MobileNumber { get; set; }


        public string CardNumber { get; set; }

        public string CardExpiry { get; set; }

        public string CardCvv { get; set; }

        public void Resolve(PaymentIssuer[] issuers)
        {

            if (IssuerType == PaymentIssuerType.Mobile)
            {
                if (string.IsNullOrWhiteSpace(MobileNumber))
                    throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' must not be empty.");

                var mobileUtil = PhoneNumberUtil.GetInstance();
                PhoneNumber mobileInfo = null;

                try
                {
                    mobileInfo = mobileUtil.Parse(MobileNumber, null);
                }
                catch (NumberParseException)
                {
                    throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' is not in a valid format.");
                }

                if (!(mobileUtil.IsValidNumber(mobileInfo) && MobileNumber == $"+{mobileInfo.CountryCode}{mobileInfo.NationalNumber}"))
                    throw new PaymentDetailsException(nameof(MobileNumber), "'Mobile number' is not in a valid format.");

                var mobileIssers = issuers.Where(_ => _.Type == PaymentIssuerType.Mobile);
                var mobileIssuer = mobileIssers.FirstOrDefault(_ => Regex.IsMatch(mobileInfo.NationalNumber.ToString(), _.Pattern));

                if (mobileIssuer == null)
                    throw new PaymentDetailsException(nameof(MobileNumber), $"'Mobile number' is not supported by any of these issuers. {mobileIssers.Select(_ => _.Name).Humanize()}");

                IssuerName = mobileIssuer.Name;
                IssuerCode = mobileIssuer.Code;
            }
            else if (IssuerType == PaymentIssuerType.Card)
            {

            }
            else throw new NotImplementedException();
        }
    }

    [Serializable]
    public class PaymentDetailsException : Exception
    {

        public PaymentDetailsException(string name, string message) : base(message)
        {
            Name = name;
        }

        public string Name { get; set; }
    }

    public class PaymentIssuer
    {
        public PaymentIssuer(PaymentIssuerType type, string code, string pattern, string name)
        {
            Type = type;
            Code = code;
            Pattern = pattern;
            Name = name;
        }

        public PaymentIssuerType Type { get; set; }

        public string Code { get; set; }

        public string Name { get; set; }

        public string Pattern { get; set; }
    }

    public enum PaymentIssuerType
    {
        Card,
        Mobile
    }

    public enum PaymentMode
    {
        Checkout,
        Mobile,
        Card,
    }

    public enum PaymentType
    {
        Credit,
        Debit,
    }

    public enum PaymentStatus
    {
        Pending,
        Processing,
        Complete,
        Failed
    }
}