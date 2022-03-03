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

        public static bool TryFormatPhone(string value, out string result)
        {
            try
            {
                var phoneNumberUtil = PhoneNumbers.PhoneNumberUtil.GetInstance();
                var phoneNumberObj = phoneNumberUtil.Parse(value, null);

                if (!phoneNumberUtil.IsValidNumber(phoneNumberObj) || value !=  $"+{phoneNumberObj.CountryCode}{phoneNumberObj.NationalNumber}")
                {
                    throw new ArgumentException("Phone number is not valid.", nameof(value));
                }

                result = value;
                return true;
            }
            catch
            {
                result = null;
                return false;
            }
        }

        // source: https://stackoverflow.com/questions/1365407/c-sharp-code-to-validate-email-address
        public static bool TryFormatEmail(string value, out string result)
        {
            try
            {
                var emailUtil = new System.Net.Mail.MailAddress(value.ToLowerInvariant());

                if (value != emailUtil.Address)
                {
                    throw new ArgumentException("Email is not valid.", nameof(value));
                }

                result = emailUtil.Address;
                return true;
            }
            catch (Exception)
            {
                result = null;
                return false;
            }
        }
    }
}