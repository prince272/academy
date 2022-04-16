using Academy.Server.Data.Converters;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace Academy.Server.Data.Configurations
{
    public class ContentConfiguration : IEntityTypeConfiguration<Content>
    {
        public void Configure(EntityTypeBuilder<Content> builder)
        {
            builder.Property(_ => _.Media).HasJsonValueConversion();
            builder.Property(_ => _.Answers).HasJsonValueConversion().HasDefaultValue(Array.Empty<ContentAnswer>());
            builder.Property(_ => _.Checks).HasJsonValueConversion().HasDefaultValue(Array.Empty<string>());
        }
    }
}
