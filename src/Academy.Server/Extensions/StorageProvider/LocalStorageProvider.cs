using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.StorageProvider
{
    public class LocalStorageProvider : IStorageProvider
    {
        private readonly LocalStorageOptions localStorageOptions;
        private readonly HttpContext httpContext;
        private readonly ILogger<LocalStorageProvider> logger;

        public LocalStorageProvider(IServiceProvider serviceProvider)
        {
            localStorageOptions = serviceProvider.GetRequiredService<IOptions<LocalStorageOptions>>().Value;
            httpContext = serviceProvider.GetRequiredService<IHttpContextAccessor>().HttpContext;
            logger = serviceProvider.GetRequiredService<ILogger<LocalStorageProvider>>();
        }

        public async Task<Stream> WriteAsync(string path, Stream stream, long offset, long length)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            if (stream == null)
                throw new ArgumentNullException(nameof(stream));

            string tempPath = GetTempPath(path);
            FileStream tempStream = null;
            long tempStreamLength = 0;

            try
            {
                tempStream = File.Open(tempPath, FileMode.OpenOrCreate, FileAccess.Write);
                tempStream.Seek(offset, SeekOrigin.Begin);
                await stream.CopyToAsync(tempStream);
                tempStreamLength = tempStream.Length;
            }
            finally
            {
                if (tempStream != null)
                    await tempStream.DisposeAsync();
            }

            if (tempStreamLength == length)
            {
                string sourcePath = GetSourcePath(path);
                File.Move(tempPath, sourcePath, false);
                return File.OpenRead(sourcePath);
            }
            else
            {
                return null;
            }
        }

        public async Task WriteAsync(string path, Stream stream)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            if (stream == null)
                throw new ArgumentNullException(nameof(stream));

            var position = stream.Position;

            string sourcePath = GetSourcePath(path);
            using var sourceStream = File.Open(sourcePath, FileMode.CreateNew, FileAccess.Write);
            sourceStream.Seek(0, SeekOrigin.Begin);
            await stream.CopyToAsync(sourceStream);

            stream.Position = position;
        }

        public Task DeleteAsync(string path)
        {
            try
            {
                string sourcePath = GetSourcePath(path);

                if (File.Exists(sourcePath))
                    File.Delete(sourcePath);
            }
            catch { }

            try
            {
                string tempPath = GetTempPath(path);

                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
            catch { }

            return Task.CompletedTask;
        }

        public string GetUrl(string path)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            string sourceUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host.ToUriComponent()}{path}";

            return sourceUrl;
        }

        public Task<Stream> GetStreamAsync(string path)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            string sourcePath = GetSourcePath(path);

            try { return Task.FromResult<Stream>(File.OpenRead(sourcePath)); }
            catch (Exception ex)
            {
                logger.LogError("Unable to find the file stream.", ex);
                return Task.FromResult<Stream>(null);
            }
        }

        private string GetSourcePath(string path)
        {
            string sourcePath = $"{localStorageOptions.RootPath}{path.Replace("/", "\\")}";
            string sourceDirectory = Path.GetDirectoryName(sourcePath);

            if (!Directory.Exists(sourceDirectory))
                Directory.CreateDirectory(sourceDirectory);

            return sourcePath;
        }

        private string GetTempPath(string path)
        {
            return $"{GetSourcePath(path)}.temp";
        }
    }
}
