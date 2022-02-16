using System.IO;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.StorageProvider
{
    public interface IStorageProvider
    {
        Task<Stream> WriteAsync(string path, Stream stream, long offset, long length);

        Task WriteAsync(string path, Stream stream);

        Task DeleteAsync(string path);

        string GetUrl(string path);

        Task<Stream> GetStreamAsync(string path);
    }
}
