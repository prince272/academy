using Academy.Server.Data.Entities;
using FluentValidation;
using System.Collections.Generic;

namespace Academy.Server.Models.Courses
{
    public class ProgressModel
    {
        public int Id { get; set; }

        public ProgressType Type { get; set; }

        public bool Force { get; set; }

        public string[] Answers { get; set; }
    }

    public class ProgressValidator : AbstractValidator<ProgressModel>
    {
        public ProgressValidator()
        {
        }
    }
}