using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class HttpClientExtensions
    {
        private static readonly JsonSerializer _jsonSerializer = new JsonSerializer();

        public static async Task<T> ReadAsJsonAsync<T>(this HttpContent httpContent, CancellationToken cancellationToken = default)
        {
            using (var stream = await httpContent.ReadAsStreamAsync(cancellationToken))
            {
                var jsonReader = new JsonTextReader(new StreamReader(stream));

                return _jsonSerializer.Deserialize<T>(jsonReader);
            }
        }

        public static Task<HttpResponseMessage> SendAsJsonAsync(this HttpClient client, HttpMethod method, string url, object value, IDictionary<string, string> headers, CancellationToken cancellationToken = default)
        {
            var stream = new MemoryStream();
            var jsonWriter = new JsonTextWriter(new StreamWriter(stream));

            _jsonSerializer.Serialize(jsonWriter, value);

            jsonWriter.Flush();

            stream.Position = 0;

            var request = new HttpRequestMessage(method, url)
            {
                Content = new StreamContent(stream)
            };

            if (headers != null)
            {
                foreach (var header in headers)
                    request.Headers.Add(header.Key, header.Value);
            }

            request.Content.Headers.TryAddWithoutValidation("Content-Type", "application/json");

            return client.SendAsync(request, cancellationToken);
        }
    }
}