using System;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;

namespace Academy.Server.Utilities
{
    public static class ValidationHelper
    {

        public static bool PhoneOrEmail(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return Regex.IsMatch(username.ToLowerInvariant(), "^[-+0-9() ]+$");
        }

        public static string FormatPhone(string value)
        {

            var phoneNumberUtil = PhoneNumbers.PhoneNumberUtil.GetInstance();
            var phoneNumberObj = phoneNumberUtil.Parse(value, null);
            if (!phoneNumberUtil.IsValidNumber(phoneNumberObj))
            {
                throw new InvalidOperationException("Phone number is not valid.");
            }

            var phoneNumber = $"+{phoneNumberObj.CountryCode}{phoneNumberObj.NationalNumber}";
            return phoneNumber;
        }

        public static bool TryFormatPhone(string value, out string phoneNumber)
        {
            try
            {
                phoneNumber = FormatPhone(value);
                return true;
            }
            catch
            {
                phoneNumber = null;
                return false;
            }
        }

        // C# code to validate email address
        // source: https://stackoverflow.com/questions/1365407/c-sharp-code-to-validate-email-address

        public static string FormatEmail(string value)
        {
            var mailAddress = new System.Net.Mail.MailAddress(value.ToLowerInvariant());
            var email = mailAddress.Address;
            return email;
        }

        public static bool TryFormatEmail(string value, out string email)
        {
            try
            {
                email = FormatEmail(value);
                return true;
            }
            catch (Exception)
            {
                email = null;
                return false;
            }
        }
    }
}