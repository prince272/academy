using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Server.Services
{
    public class SharedService : ISharedService
    {
        private readonly AppSettings settings;
        private readonly IStorageProvider storageProvider;
        private readonly IDocumentProcessor documentProcessor;

        public SharedService(IServiceProvider serviceProvider)
        {
            settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            documentProcessor = serviceProvider.GetRequiredService<IDocumentProcessor>();
        }
    }

    public interface ISharedService
    {
    }
}