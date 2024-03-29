﻿using System;

namespace Academy.Server.Data.Entities
{
    public class Payment : IEntity, IExtendable
    {
        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string FullName { get; set; }

        public int UserId { get; set; }

        public string TransactionId { get; set; }

        public int Id { get; set; }

        public PaymentReason Reason { get; set; }

        public string Code { get; set; }

        public PaymentMode Mode { get; set; }

        public PaymentStatus Status { get; set; }

        public PaymentType Type { get; set; }

        public string Gateway { get; set; }

        public decimal Amount { get; set; }

        public string Title { get; set; }

        public string IPAddress { get; set; }

        public DateTimeOffset Issued { get; set; }

        public DateTimeOffset? Processing { get; set; }

        public DateTimeOffset? Completed { get; set; }

        public string ExtensionData { get; set; }

        public string UAString { get; set; }

        public string ReturnUrl { get; set; }

        public string RedirectUrl { get; set; }
    }

    public enum PaymentMode
    {
        Mobile,
        Card,
        External
    }

    public enum PaymentType
    {
        Payout,
        Payin,
    }

    public enum PaymentStatus
    {
        Pending,
        Processing,
        Succeeded,
        Failed
    }

    public enum PaymentReason
    {
        Sponsorship,
        Course,
        Withdrawal
    }
}