using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class Compute
    {
        public static async Task<string> GenerateSlugAsync(string text, Func<string, Task<bool>> exists)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            string slug = null;
            int count = 1;

            do
            {
                slug = GenerateSlug($"{text}{(count == 1 ? "" : $" {count}")}".Trim());
                count += 1;
            } while (await exists(slug));

            return slug;
        }


        // URL Slugify algorithm in C#?
        // source: https://stackoverflow.com/questions/2920744/url-slugify-algorithm-in-c/2921135#2921135
        public static string GenerateSlug(string text, string separator = null)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            static string RemoveDiacritics(string text)
            {
                var normalizedString = text.Normalize(NormalizationForm.FormD);
                var stringBuilder = new StringBuilder();

                foreach (var c in normalizedString)
                {
                    var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                    if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                    {
                        stringBuilder.Append(c);
                    }
                }

                return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
            }

            separator ??= "-";

            // remove all diacritics.
            text = RemoveDiacritics(text);

            // Remove everything that's not a letter, number, hyphen, dot, whitespace or underscore.
            text = Regex.Replace(text, @"[^a-zA-Z0-9\-\.\s_]", string.Empty, RegexOptions.Compiled).Trim();

            // replace symbols with a hyphen.
            text = Regex.Replace(text, @"[\-\.\s_]", separator, RegexOptions.Compiled);

            // replace double occurrences of hyphen.
            text = Regex.Replace(text, @"(-){2,}", "$1", RegexOptions.Compiled).Trim('-');

            return text;
        }

        public static string GenerateMD5(string inputString)
        {
            // Use input string to calculate MD5 hash
            using MD5 md5 = MD5.Create();
            byte[] inputBytes = System.Text.Encoding.ASCII.GetBytes(inputString);
            byte[] hashBytes = md5.ComputeHash(inputBytes);

            // Convert the byte array to hexadecimal string
            var sb = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                sb.Append(hashBytes[i].ToString("X2"));
            }
            return sb.ToString();
        }

        public static string GenerateMD5(Stream inputStream)
        {
            // Use input string to calculate MD5 hash
            using MD5 md5 = MD5.Create();
            byte[] hashBytes = md5.ComputeHash(inputStream);

            // Convert the byte array to hexadecimal string
            var sb = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                sb.Append(hashBytes[i].ToString("X2"));
            }
            return sb.ToString();
        }

        public const string NATURAL_NUMERIC_CHARS = "123456789";
        public const string WHOLE_NUMERIC_CHARS = "0123456789";
        public const string LOWER_ALPHA_CHARS = "abcdefghijklmnopqrstuvwyxz";
        public const string UPPER_ALPHA_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        public static string GenerateNumber(int length)
        {
            return string.Join("", Enumerable.Range(1, length).Select(_ => $"{RandomNumberGenerator.GetInt32(0, 10)}"));
        }

        public static string GenerateCode(string prefix)
        {
            return $"{prefix}-{DateTimeOffset.UtcNow:yyyyMM}{GenerateNumber(6)}";
        }
    }
}
