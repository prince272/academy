using Academy.Server.Data.Converters;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Collections.Generic;

namespace Academy.Server.Data.Configurations
{
    public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
    {
        public void Configure(EntityTypeBuilder<Certificate> builder)
        {
            builder.Property(_ => _.Image).HasJsonValueConversion();
            builder.Property(_ => _.Document).HasJsonValueConversion();
        }
    }
}
