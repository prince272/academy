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

            return new ValueTask<long>(duration);
        }

        public ValueTask<long> CalculateDurationAsync(Question question)
        {
            var duration = 0L;
            
            if (question.Text != null) duration += Sanitizer.GetHtmlReadingDuration(question.Text);
            duration += question.Answers.Select(_ => _.Text != null ? Sanitizer.GetHtmlReadingDuration(_.Text) : 0L).Sum();

            return new ValueTask<long>(duration);
        }

        public ValueTask<decimal> CalculatePriceAsync(Course course)
        {
            if (course.Cost == 0) return new ValueTask<decimal>(0);

            int totalBits = 0;

            totalBits += course.Sections.SelectMany(_ => _.Lessons).Count()
                * settings.Currency.BitRules.First(_ => _.Type == BitRuleType.CompleteLesson).Value;

            totalBits += course.Sections.SelectMany(_ => _.Lessons).SelectMany(_ => _.Questions).Count()
                * settings.Currency.BitRules.First(_ => _.Type == BitRuleType.AnswerQuestionCorrectly).Value;

            var price = (course.Cost + settings.Currency.ConvertBitsToCurrencyValue(totalBits));
            return new ValueTask<decimal>(price);
        }
    }

    public interface ISharedService
    {
        ValueTask<long> CalculateDurationAsync(Lesson lesson);

        ValueTask<long> CalculateDurationAsync(Question question);

        ValueTask<decimal> CalculatePriceAsync(Course course);
    }
}