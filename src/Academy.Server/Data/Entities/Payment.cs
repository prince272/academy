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
        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string FullName { get; set; }

        public int? UserId { get; set; }

        public string TransactionId { get; set; }

        public int Id { get; set; }

        public PaymentReason Reason { get; set; }

        public string ReferenceId { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentType Type { get; set; }

        public string Gateway { get; set; }

        public decimal Amount { get; set; }

        public string Title { get; set; }

        public string IPAddress { get; set; }

        public DateTimeOffset Issued { get; set; }

        public DateTimeOffset? Completed { get; set; }

        public string ExtensionData { get; set; }

        public string UAString { get; set; }

        public string CheckoutUrl { get; set; }

        public string RedirectUrl { get; set; }
    }

    public enum PaymentType
    {
        Cashout,
        Cashin,
    }

    public enum PaymentStatus
    {
        Pending,
        Processing,
        Complete,
        Failed
    }

    public enum PaymentReason
    {
        Sponsorship,
        Course,
        Withdrawal
    }
}