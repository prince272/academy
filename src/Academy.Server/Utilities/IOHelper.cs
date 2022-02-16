using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class IOHelper
    {
        public static async Task<byte[]> ConvertToBytesAsync(Stream value)
        {
            if (value is MemoryStream)
                return ((MemoryStream)value).ToArray();

            using var memoryStream = new MemoryStream();
            await value.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }

        public static async Task<string> ConvertToStringAsync(Stream value, Encoding encoding = null)
        {
            if (encoding == null)
                encoding = Encoding.UTF8;

            using StreamReader reader = new StreamReader(value, encoding);
            return await reader.ReadToEndAsync();
        }

        public static Task<Stream> ConvertToStreamAsync(string value, Encoding encoding = null)
        {
            if (encoding == null)
                encoding = Encoding.UTF8;

            var byteArray = encoding.GetBytes(value);
            return Task.FromResult((Stream)new MemoryStream(byteArray));
        }
    }
}