using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.DocumentProcessor
{
    public interface IDocumentProcessor
    {
        Task MergeAsync(Stream source, Stream destination, IDictionary<string, object> fields);

        Task ConvertAsync(Stream source, Stream destination, DocumentFormat format);
    }
}
