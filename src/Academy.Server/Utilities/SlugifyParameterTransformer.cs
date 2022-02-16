using Humanizer;
using Microsoft.AspNetCore.Routing;

namespace Academy.Server.Utilities
{
    public class SlugifyParameterTransformer : IOutboundParameterTransformer
    {
        public string TransformOutbound(object value)
        {
            return value?.ToString().Kebaberize();
        }
    }
}
