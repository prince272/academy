using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using System;
using System.Collections.Generic;

namespace Academy.Server
{
    public class CompanyInfo
    {
        public string Name { get; set; }

        public string Description { get; set; }

        public string PlatformDescription { get; set; }

        public DateTimeOffset Established { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public string Address { get; set; }

        public string City { get; set; }

        public string Province { get; set; }

        public string ProvinceCode { get; set; }

        public string Country { get; set; }

        public string CountryCode { get; set; }

        public string MapLink { get; set; }

        public string FacebookLink { get; set; }

        public string InstagramLink { get; set; }

        public string LinkedinLink { get; set; }

        public string TwitterLink { get; set; }

        public string YoutubeLink { get; set; }
    }

    public class CurrencyInfo
    {
        public string Name { get; set; }

        public string Code { get; set; }

        public string Symbol { get; set; }

        public decimal Limit { get; set; }

        public List<BitRule> BitRules { get; set; }

        public decimal ConvertBitsToCurrencyValue(int bits)
        {
            return Math.Round(bits * 0.062m, 2, MidpointRounding.AwayFromZero);
        }
    }

    public class MediaSettings
    {
        public List<MediaRule> Rules { get; set; }

        public Func<string, MediaType, string, string> GetPath { get; set; }
    }

    public static class RoleNames
    {
        public const string Manager = "Manager";

        public const string Teacher = "Teacher";

        public static string[] All = new string[] { Manager, Teacher };
    }

    public class EmailAccounts
    {
        public EmailAccount Administrator { get; set; }

        public EmailAccount Support { get; set; }

        public EmailAccount Notification { get; set; }
    }

    public class AppSettings
    {
        public CompanyInfo Company { get; set; }

        public CurrencyInfo Currency { get; set; }

        public MediaSettings Media { get; set; }
    }

    public class MediaRule
    {
        public MediaRule(MediaType type, string[] extensions, long size)
        {
            Type = type;
            Extensions = extensions;
            Size = size;
        }

        public string[] Extensions { get; }

        public long Size { get; }

        public MediaType Type { get; set; }
    }

    public class BitRule
    {
        public BitRule(BitRuleType type, int value, string description)
        {
            Type = type;
            Value = value;
            Description = description;
        }

        public BitRuleType Type { get; set; }

        public int Value { get; set; }

        public string Description { get; set; }
    }

    public enum BitRuleType
    {
        CompleteLesson,
        AnswerCorrectly,
        AnswerWrongly,
        SkipQuestion
    }
}