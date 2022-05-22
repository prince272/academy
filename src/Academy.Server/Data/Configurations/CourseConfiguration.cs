using Academy.Server.Data.Converters;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace Academy.Server.Data.Configurations
{
    public class CourseConfiguration : IEntityTypeConfiguration<Course>
    {
        public void Configure(EntityTypeBuilder<Course> builder)
        {
            builder.Property(_ => _.Image).HasJsonValueConversion();
            builder.Property(_ => _.CertificateTemplate).HasJsonValueConversion();
        }
    }

    public class CourseProgressConfiguration : IEntityTypeConfiguration<CourseProgress>
    {
        public void Configure(EntityTypeBuilder<CourseProgress> builder)
        {
            builder.HasOne(_ => _.User).WithMany(_ => _.CourseProgresses).HasForeignKey(_ => _.UserId).IsRequired(true).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(_ => _.Course).WithMany(_ => _.Progresses).HasForeignKey(_ => _.CourseId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            builder.Property(_ => _.Checks).HasJsonValueConversion().HasDefaultValue(Array.Empty<string>());
        }
    }
}
