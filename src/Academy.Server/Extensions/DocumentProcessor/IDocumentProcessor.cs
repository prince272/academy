using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.DocumentProcessor
{
    public interface IDocumentProcessor
    {
        Task MergeAsync(Stream source, Stream destination, DocumentFormat type, IDictionary<string, string> fields);
    }
}
