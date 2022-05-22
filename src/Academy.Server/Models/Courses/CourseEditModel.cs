using Academy.Server.Data.Entities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Models.Courses
{
    public class CourseEditModel
    {
        public string Title { get; set; }

        public CourseSubject Subject { get; set; }

        public string Description { get; set; }

        public bool Published { get; set; }

        public int? ImageId { get; set; }

        public int? CertificateTemplateId { get; set; }

        public decimal Cost { get; set; }
    }

    public class CourseEditValidator : AbstractValidator<CourseEditModel>
    {
        public CourseEditValidator(IServiceProvider serviceProvider)
        {
            var settings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;

            RuleFor(_ => _.Title).NotEmpty();

            RuleFor(_ => _.Description).NotEmpty();

            RuleFor(_ => _.Cost).LessThanOrEqualTo(settings.Currency.Limit).GreaterThanOrEqualTo(0);
        }
    }
}
