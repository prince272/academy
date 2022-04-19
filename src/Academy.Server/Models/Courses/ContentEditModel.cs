using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using FluentValidation;
using System.Collections.Generic;

namespace Academy.Server.Models.Courses
{
    public class ContentEditModel
    {
        public ContentType Type { get; set; }

        public string Explanation { get; set; }

        public int? MediaId { get; set; }

        public string ExternalMediaUrl { get; set; }

        public string Question { get; set; }

        public AnswerType? AnswerType { get; set; }

        public ContentAnswerEditModel[] Answers { get; set; } 
    }

    public class ContentEditValidator : AbstractValidator<ContentEditModel>
    {
        public ContentEditValidator()
        {
            RuleFor(_ => _.ExternalMediaUrl).Url();
        }
    }

    public class ContentAnswerEditModel
    {
        public int Id { get; set; }

        public string Text { get; set; }

        public bool Checked { get; set; }
    }

    public class ContentAnswerEditValidator : AbstractValidator<ContentAnswerEditModel>
    {
        public ContentAnswerEditValidator()
        {
            RuleFor(_ => _.Text).NotEmpty().WithName("Content");
        }
    }
}
