using Microsoft.AspNetCore.Http;

namespace Academy.Server.Utilities.AnonymousId
{
    public class AnonymousIdCookieOptions : CookieOptions
    {
        public string Name { get; set; }

        public bool SlidingExpiration { get; set; } = true;

        public int Timeout { get; set; }
    }
}