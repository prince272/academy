using Microsoft.AspNetCore.Http;
using System;

namespace Academy.Server.Utilities.AnonymousId
{
    public class AnonymousIdCookieOptionsBuilder : CookieBuilder
    {
        private const string DEFAULT_COOKIE_NAME = ".ASPXANONYMOUS";
        private const string DEFAULT_COOKIE_PATH = "/";
        private const int DEFAULT_COOKIE_TIMEOUT = 100000;
        private const int MINIMUM_COOKIE_TIMEOUT = 1;
        private const int MAXIMUM_COOKIE_TIMEOUT = 60 * 60 * 24 * 365 * 2;

        public int? Timeout { get; set; }

        public new virtual AnonymousIdCookieOptions Build(HttpContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            return new AnonymousIdCookieOptions
            {
                Name = Name ?? DEFAULT_COOKIE_NAME,
                Path = Path ?? DEFAULT_COOKIE_PATH,
                Timeout = Timeout.HasValue ? Math.Min(Math.Max(MINIMUM_COOKIE_TIMEOUT, Timeout.Value), MAXIMUM_COOKIE_TIMEOUT) : DEFAULT_COOKIE_TIMEOUT,
                SameSite = SameSite,
                HttpOnly = HttpOnly,
                MaxAge = MaxAge,
                Domain = Domain,
                IsEssential = IsEssential,
                Secure = SecurePolicy == CookieSecurePolicy.Always || (SecurePolicy == CookieSecurePolicy.SameAsRequest && context.Request.IsHttps),
            };
        }
    }
}