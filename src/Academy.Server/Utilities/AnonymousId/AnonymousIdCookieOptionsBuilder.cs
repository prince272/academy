using Microsoft.AspNetCore.Http;
using System;

namespace Academy.Server.Utilities.AnonymousId
{
    public class AnonymousIdCookieOptionsBuilder : CookieBuilder
    {
        private const string DEFAULT_COOKIE_NAME = ".ASPXANONYMOUS";
        private const string DEFAULT_COOKIE_PATH = "/";

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
                SameSite = SameSite,
                HttpOnly = HttpOnly,
                MaxAge = MaxAge,
                Domain = Domain,
                IsEssential = IsEssential,
                Secure = SecurePolicy == CookieSecurePolicy.Always || (SecurePolicy == CookieSecurePolicy.SameAsRequest && context.Request.IsHttps),
                Expires = DateTime.Now.Add(Expiration ?? TimeSpan.FromDays(14))
            };
        }
    }
}