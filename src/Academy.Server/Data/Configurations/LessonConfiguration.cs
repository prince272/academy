﻿using Academy.Server.Data.Converters;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Server.Data.Configurations
{
    public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
    {
        public void Configure(EntityTypeBuilder<Lesson> builder)
        {
            builder.Property(_ => _.Media).HasJsonValueConversion();
            builder.Property(_ => _.Document).HasJsonValueConversion();
        }
    }
}
