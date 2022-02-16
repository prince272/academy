using Academy.Server.Data.Converters;
using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Collections.Generic;

namespace Academy.Server.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasMany(_ => _.UserRoles).WithOne(_ => _.User).HasForeignKey(_ => _.UserId).IsRequired();
            builder.Property(_ => _.Progresses).HasJsonValueConversion().HasDefaultValue(new List<Progress>());
        }
    }

    public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
    {
        public void Configure(EntityTypeBuilder<UserRole> builder)
        {
        }
    }
}
