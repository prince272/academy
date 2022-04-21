using Ganss.XSS;
using HtmlAgilityPack;
using System;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace Academy.Server.Utilities
{
    public static class Sanitizer
    {
        public static string StripHtml(string html)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            doc.LoadHtml(html);

            if (doc.DocumentNode == null || doc.DocumentNode.ChildNodes == null)
            {
                return WebUtility.HtmlDecode(html);
            }

            var sb = new StringBuilder();
            var i = 0;

            foreach (var node in doc.DocumentNode.ChildNodes)
            {
                var text = node.InnerText.SafeTrim();

                if (!string.IsNullOrEmpty(text))
                {
                    sb.Append(text);

                    if (i < doc.DocumentNode.ChildNodes.Count - 1)
                    {
                        sb.Append(Environment.NewLine);
                    }
                }

                i++;
            }

            return WebUtility.HtmlDecode(sb.ToString());
        }

        public static string SafeTrim(this string str)
        {
            if (str == null)
                return null;

            return str.Trim();
        }

        public static string SanitizeHtml(string html)
        {
            var sanitizer = new HtmlSanitizer();
            sanitizer.AllowedAttributes.Add("class");
            sanitizer.AllowedSchemes.Add("data");

            html = sanitizer.Sanitize(html).Trim();

            return html;
        }

        public static long GetTextReadingDuration(string text)
        {
            if (text == null) throw new ArgumentNullException(nameof(text));

            var wordCount = ((Func<int>)(() =>
            {
                int wordCount = 0, index = 0;

                // skip whitespace until first word
                while (index < text.Length && char.IsWhiteSpace(text[index]))
                    index++;

                while (index < text.Length)
                {
                    // check if current char is part of a word
                    while (index < text.Length && !char.IsWhiteSpace(text[index]))
                        index++;

                    wordCount++;

                    // skip whitespace until next word
                    while (index < text.Length && char.IsWhiteSpace(text[index]))
                        index++;
                }

                return wordCount;
            }))();

            // Slow = 100 wpm, Average = 130 wpm, Fast = 160 wpm. 
            var wordsPerMinute = 70;
            var wordsTotalSeconds = wordCount / (wordsPerMinute / 60);
            var wordsTotalTicks = (long)Math.Round(wordsTotalSeconds * Math.Pow(10, 9) / 100);
            return wordsTotalTicks;
        }
    }
}