using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Services
{
    public class SharedService : ISharedService
    {
        private readonly AppSettings settings;

        public SharedService(IServiceProvider serviceProvider)
        {
            settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
        }

        public ValueTask<long> CalculateDurationAsync(Lesson lesson)
        {
            var duration = 0L;

            if (lesson.Title != null) duration += Sanitizer.GetHtmlReadingDuration(lesson.Title);
            if (lesson.Document != null) duration += Sanitizer.GetHtmlReadingDuration(lesson.Document);
            if (lesson.Media != null) duration += lesson.Media.Duration.GetValueOrDefault();

            lesson.Questions.ForEach(question =>
            {
                if (question.Text != null) duration += Sanitizer.GetHtmlReadingDuration(question.Text);
                duration += question.Answers.Select(_ => _.Text != null ? Sanitizer.GetHtmlReadingDuration(_.Text) : 0L).Sum();
            });

            return new ValueTask<long>(duration);
        }
    }

    public interface ISharedService
    {
        ValueTask<long> CalculateDurationAsync(Lesson lesson);
    }
}