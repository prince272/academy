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

        public static int GenerateNumber(int min, int max)
        {
            var randomNumberBuffer = new byte[10];
            new RNGCryptoServiceProvider().GetBytes(randomNumberBuffer);
            return new Random(BitConverter.ToInt32(randomNumberBuffer, 0)).Next(min, max);
        }

        public static int GenerateNumber(int length)
        {
            var min = (int)Math.Pow(10, length - 1);
            var max = (int)Math.Pow(10, length) - 1;
            return GenerateNumber(min, max);
        }

        // source: How to make random string of numbers and letters with a length of 5? [duplicate]
        // https://stackoverflow.com/questions/9995839/how-to-make-random-string-of-numbers-and-letters-with-a-length-of-5
        public static string GenerateString(int length, string characters)
        {
            var chars = Enumerable.Range(0, length)
                .Select(x => characters[GenerateNumber(0, characters.Length)]);
            return string.Join(string.Empty, chars);
        }

        // Encrypt and decrypt a string in C#?
        // source: https://stackoverflow.com/questions/10168240/encrypting-decrypting-a-string-in-c-sharp
        public static class RijndaelOperation
        {
            static RijndaelOperation()
            {
                using RijndaelManaged myRijndael = new RijndaelManaged();

                myRijndael.GenerateKey();
                myRijndael.GenerateIV();

                MachineKey = myRijndael.Key;
                MachineIV = myRijndael.IV;
            }

            private static byte[] MachineKey { get; set; }

            private static byte[] MachineIV { get; set; }

            public static string Encrypt(string plainText)
            {
                return Convert.ToBase64String(EncryptStringToBytes(plainText, MachineKey, MachineIV));
            }

            public static string Decrypt(string cipherText)
            {
                return DecryptStringFromBytes(Convert.FromBase64String(cipherText), MachineKey, MachineIV);
            }

            private static byte[] EncryptStringToBytes(string plainText, byte[] Key, byte[] IV)
            {
                // Check arguments.
                if (plainText == null || plainText.Length <= 0)
                    throw new ArgumentNullException("plainText");
                if (Key == null || Key.Length <= 0)
                    throw new ArgumentNullException("Key");
                if (IV == null || IV.Length <= 0)
                    throw new ArgumentNullException("IV");
                byte[] encrypted;
                // Create an RijndaelManaged object
                // with the specified key and IV.
                using (RijndaelManaged rijAlg = new RijndaelManaged())
                {
                    rijAlg.Key = Key;
                    rijAlg.IV = IV;

                    // Create an encryptor to perform the stream transform.
                    ICryptoTransform encryptor = rijAlg.CreateEncryptor(rijAlg.Key, rijAlg.IV);

                    // Create the streams used for encryption.
                    using (MemoryStream msEncrypt = new MemoryStream())
                    {
                        using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                        {
                            using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                            {

                                //Write all data to the stream.
                                swEncrypt.Write(plainText);
                            }
                            encrypted = msEncrypt.ToArray();
                        }
                    }
                }

                // Return the encrypted bytes from the memory stream.
                return encrypted;
            }

            private static string DecryptStringFromBytes(byte[] cipherText, byte[] Key, byte[] IV)
            {
                // Check arguments.
                if (cipherText == null || cipherText.Length <= 0)
                    throw new ArgumentNullException(nameof(cipherText));
                if (Key == null || Key.Length <= 0)
                    throw new ArgumentNullException(nameof(Key));
                if (IV == null || IV.Length <= 0)
                    throw new ArgumentNullException(nameof(IV));

                // Declare the string used to hold
                // the decrypted text.
                string plaintext = null;

                // Create an RijndaelManaged object
                // with the specified key and IV.
                using (RijndaelManaged rijAlg = new RijndaelManaged())
                {
                    rijAlg.Key = Key;
                    rijAlg.IV = IV;

                    // Create a decryptor to perform the stream transform.
                    ICryptoTransform decryptor = rijAlg.CreateDecryptor(rijAlg.Key, rijAlg.IV);

                    // Create the streams used for decryption.
                    using (MemoryStream msDecrypt = new MemoryStream(cipherText))
                    {
                        using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                            {
                                // Read the decrypted bytes from the decrypting stream
                                // and place them in a string.
                                plaintext = srDecrypt.ReadToEnd();
                            }
                        }
                    }
                }

                return plaintext;
            }
        }
    }
}
