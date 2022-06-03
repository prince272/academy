using System;

namespace Academy.Server.Utilities.AnonymousId
{
    internal class AnonymousIdData
    {
        internal string AnonymousId;
        internal DateTime ExpireDate;

        internal AnonymousIdData(string id, DateTime timeStamp)
        {
            AnonymousId = timeStamp > DateTime.UtcNow ? id : null;
            ExpireDate = timeStamp;
        }
    }
}