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

        public async Task WriteDocmentAsync(Lesson lesson, string documentContent)
        {
            documentContent = await documentProcessor.ProcessHtmlDocumentAsync(documentContent);

            if (documentContent == null)
            {
                lesson.Document = null;
            }
            else
            {
                using var documentStream = new MemoryStream(Encoding.UTF8.GetBytes(documentContent));

                if (lesson.Document == null)
                {
                    var mediaType = MediaType.Document;
                    var mediaName = $"{lesson.Title} Document.html";
                    var mediaPath = MediaConstants.GetPath("html", mediaType, mediaName);

                    lesson.Document = new Media
                    {
                        Name = mediaName,
                        Type = mediaType,
                        Path = mediaPath,
                        ContentType = MimeTypeMap.GetMimeType(mediaName),
                        Size = documentStream.Length
                    };
                }

                lesson.Document.Duration = Sanitizer.GetTextReadingDuration(Sanitizer.StripHtml(documentContent));
                await storageProvider.WriteAsync(lesson.Document.Path, documentStream);
            }
        }

        public void CalculateDuration(Lesson lesson)
        {
            var duration = 0L;

            if (lesson.Title != null) duration += Sanitizer.GetTextReadingDuration(lesson.Title);
            if (lesson.Document != null) duration += lesson.Document.Duration.GetValueOrDefault();
            if (lesson.Media != null) duration += lesson.Media.Duration.GetValueOrDefault();

            lesson.Questions.ForEach(question =>
            {
                if (question.Text != null) duration += Sanitizer.GetTextReadingDuration(question.Text);
                duration += question.Answers.Select(_ => _.Text != null ? Sanitizer.GetTextReadingDuration(_.Text) : 0L).Sum();
            });

            lesson.Duration = duration;
        }
    }

    public interface ISharedService
    {
        void CalculateDuration(Lesson lesson);

        Task WriteDocmentAsync(Lesson lesson, string document);
    }
}