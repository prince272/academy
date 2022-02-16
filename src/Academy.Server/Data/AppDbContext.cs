using Academy.Server.Data.Entities;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Options;
using IdentityServer4.EntityFramework.Extensions;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace Academy.Server.Data
{
    public class AppDbContext : IdentityDbContext<User, Role, int, 
        IdentityUserClaim<int>, UserRole, IdentityUserLogin<int>,
        IdentityRoleClaim<int>, IdentityUserToken<int>>, IPersistedGrantDbContext
    {
        private readonly IOptions<OperationalStoreOptions> _operationalStoreOptions;

        public AppDbContext(
            DbContextOptions options,
            IOptions<OperationalStoreOptions> operationalStoreOptions)
            : base(options)
        {
            _operationalStoreOptions = operationalStoreOptions;
        }

        #region IPersistedGrantDbContext

        public DbSet<PersistedGrant> PersistedGrants { get; set; }
        public DbSet<DeviceFlowCodes> DeviceFlowCodes { get; set; }
        public Task<int> SaveChangesAsync() => base.SaveChangesAsync();

        #endregion

        private void ConfigurePersistentGrantDbContext(ModelBuilder builder)
        {
            var options = _operationalStoreOptions.Value;
            SetSchemaForAllTables(options, "isgrants");

            builder.ConfigurePersistedGrantContext(options);
        }

        private void ConfigureEntityTypesDbContext(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }

        private void SetSchemaForAllTables<T>(T options, string schema)
        {
            var tableConfigurationType = typeof(TableConfiguration);
            var schemaProperty = tableConfigurationType.GetProperty(nameof(TableConfiguration.Schema));

            var tableConfigurations = options.GetType()
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(property => tableConfigurationType.IsAssignableFrom(property.PropertyType))
                .Select(property => property.GetValue(options, null));

            foreach (var table in tableConfigurations)
                schemaProperty.SetValue(table, schema, null);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            ConfigurePersistentGrantDbContext(builder);
            ConfigureEntityTypesDbContext(builder);

            // Entity Framework Core - setting the decimal precision and scale to all decimal properties [duplicate]
            // source: https://stackoverflow.com/questions/43277154/entity-framework-core-setting-the-decimal-precision-and-scale-to-all-decimal-p
            builder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?))
                .ToList().ForEach(property =>
                {
                    // EF Core 1 & 2
                    //property.Relational().ColumnType = "decimal(18, 6)";

                    // EF Core 3
                    //property.SetColumnType("decimal(18, 6)");

                    // EF Core 5
                    property.SetPrecision(18);
                    property.SetScale(6);
                });
        }
    }
}
