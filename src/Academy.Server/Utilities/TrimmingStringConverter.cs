using Newtonsoft.Json;
using System;

namespace Academy.Server.Utilities
{
    public class TrimmingStringConverter : JsonConverter<string>
    {
        public override bool CanRead => true;
        public override bool CanWrite => false;

        public override string ReadJson(JsonReader reader, Type objectType, string existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            return reader.Value?.ToString().Trim();
        }

        public override void WriteJson(JsonWriter writer, string value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
    }
}
