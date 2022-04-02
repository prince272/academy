using Ganss.XSS;
using System;
using System.Text.RegularExpressions;

namespace Academy.Server.Utilities
{
    public static class Sanitizer
    {
        public static string StripHtml(string html)
        {
            const string tagWhiteSpace = @"(>|$)(\W|\n|\r)+<";//matches one or more (white space or line breaks) between '>' and '<'
            const string stripFormatting = @"<[^>]*(>|$)";//match any character between '<' and '>', even when end tag is missing
            const string lineBreak = @"<(br|BR)\s{0,1}\/{0,1}>";//matches: <br>,<br/>,<br />,<BR>,<BR/>,<BR />
            var lineBreakRegex = new Regex(lineBreak, RegexOptions.Multiline);
            var stripFormattingRegex = new Regex(stripFormatting, RegexOptions.Multiline);
            var tagWhiteSpaceRegex = new Regex(tagWhiteSpace, RegexOptions.Multiline);

            var text = html;
            //Decode html specific characters
            text = System.Net.WebUtility.HtmlDecode(text);
            //Remove tag whitespace/line breaks
            text = tagWhiteSpaceRegex.Replace(text, "><");
            //Replace <br /> with line breaks
            text = lineBreakRegex.Replace(text, Environment.NewLine);
            //Strip formatting
            text = stripFormattingRegex.Replace(text, string.Empty);

            return text.Trim();
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
            var wordsPerMinute = 100;
            var wordsTotalSeconds = wordCount / (wordsPerMinute / 60);
            var wordsTotalTicks = (long)Math.Round(wordsTotalSeconds * Math.Pow(10, 9) / 100);
            return wordsTotalTicks;
        }
    }
}