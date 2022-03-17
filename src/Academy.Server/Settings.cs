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


        public string PhoneNumber { get; set; }

        public string Address { get; set; }

        public string City { get; set; }

        public string Province { get; set; }

        public string ProvinceCode { get; set; }

        public string Country { get; set; }

        public string CountryCode { get; set; }

        public string WebLink { get; set; }

        public string MapLink { get; set; }

        public string FacebookLink { get; set; }

        public string InstagramLink { get; set; }

        public string LinkedinLink { get; set; }

        public string TwitterLink { get; set; }

        public string YoutubeLink { get; set; }

        public EmailsInfo Emails { get; set; }
    }

    public class CourseInfo
    {
        public decimal Rate { get; set; }

        public List<CourseBitRule> BitRules { get; set; }
    }

    public class CurrencyInfo
    {
        public string Name { get; set; }

        public string Code { get; set; }

        public string Symbol { get; set; }

        public decimal Limit { get; set; }

     
        public decimal ConvertBitsToCurrencyValue(int bits)
        {
            return Math.Round(bits * 0.062m, 2, MidpointRounding.AwayFromZero);
        }
    }

    public class MediaInfo
    {
        public List<MediaRule> Rules { get; set; }
    }

    public class EmailsInfo
    {
        public EmailAccount App { get; set; }

        public EmailAccount Info { get; set; }
    }

    public static class JsonSerializerSettingsDefaults
    {
        public static Newtonsoft.Json.JsonSerializerSettings Web { get; set; }
    }

    public class AppSettings
    {
        public CompanyInfo Company { get; set; }

        public CurrencyInfo Currency { get; set; }

        public MediaInfo Media { get; set; }

        public CourseInfo Course { get; set; }  
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

    public class CourseBitRule
    {
        public CourseBitRule(CourseBitRuleType type, int value, string description)
        {
            Type = type;
            Value = value;
            Description = description;
        }

        public CourseBitRuleType Type { get; set; }

        public int Value { get; set; }

        public string Description { get; set; }
    }

    public enum CourseBitRuleType
    {
        CompleteLesson,
        AnswerCorrectly,
        AnswerWrongly,
        SkipQuestion
    }
}