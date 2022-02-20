using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.DocIORenderer;
using Syncfusion.EJ2.PdfViewer;
using Syncfusion.OfficeChart;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.DocumentProcessor
{
    public class WordDocumentProcessor : IDocumentProcessor
    {
        public WordDocumentProcessor()
        {
        }

        public Task MergeAsync(Stream source, Stream destination, IDictionary<string, object> fields)
        {
            var sourcePosition = source.Position;
            var destinationPosition = destination.Position;

            using var wordDocument = new WordDocument(source, FormatType.Docx);
            // Performs the mail merge.
            wordDocument.MailMerge.Execute(fields.Keys.ToArray(), fields.Values.Select(_ => _?.ToString()).ToArray());

            wordDocument.Save(destination, FormatType.Docx);
            wordDocument.Close();

            source.Position = sourcePosition;
            destination.Position = destinationPosition;

            return Task.CompletedTask;
        }

        public Task ConvertAsync(Stream source, Stream destination, DocumentFormat format)
        {
            using var wordDocument = new WordDocument(source, FormatType.Docx);

            var sourcePosition = source.Position;
            var destinationPosition = destination.Position;

            if (format == DocumentFormat.Doc)
            {
                wordDocument.Save(destination, FormatType.Doc);
                wordDocument.Close();
            }
            else if (format == DocumentFormat.Docx)
            {
                wordDocument.Save(destination, FormatType.Docx);
                wordDocument.Close();
            }
            else if (format == DocumentFormat.Pdf)
            {
                using var docRender = new DocIORenderer();
                using var pdfDocument = docRender.ConvertToPDF(wordDocument);
                pdfDocument.Save(destination);
                pdfDocument.Close();
            }
            else if (format == DocumentFormat.Jpg || format == DocumentFormat.Png)
            {
                using var pdfStream = new MemoryStream();
                using var docRender = new DocIORenderer();
                using var pdfDocument = docRender.ConvertToPDF(wordDocument);
                pdfDocument.Save(pdfStream);
                pdfDocument.Close();
                pdfStream.Position = 0;

                using var pdfRender = new PdfRenderer();
                //Loads the PDF document 
                pdfRender.Load(pdfStream, new Dictionary<string, string>());
                //Exports the PDF document pages into images
                System.Drawing.Bitmap[] bitmapimage = pdfRender.ExportAsImage(0, pdfRender.PageCount - 1);

                if (format == DocumentFormat.Jpg)
                {
                    bitmapimage[0].Save(destination, ImageFormat.Jpeg);
                    bitmapimage[0].Dispose();
                }
                else if (format == DocumentFormat.Png)
                {
                    bitmapimage[0].Save(destination, ImageFormat.Png);
                    bitmapimage[0].Dispose();
                }

                else throw new NotImplementedException();
            }

            source.Position = sourcePosition;
            destination.Position = destinationPosition;

            return Task.CompletedTask;
        }
    }

    public enum DocumentFormat
    {
        Doc,
        Docx,
        Pdf,
        Jpg,
        Png
    }
}
