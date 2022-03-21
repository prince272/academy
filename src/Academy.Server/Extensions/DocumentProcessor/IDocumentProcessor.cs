using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.DocumentProcessor
{
    public interface IDocumentProcessor
    {
        Task MergeWordDocumentAsync(Stream source, Stream destination, IDictionary<string, object> fields);

        Task ConvertWordDocumentAsync(Stream source, Stream destination, DocumentFormat format);

        Task<string> ProcessHtmlDocumentAsync(string html);
    }
}
