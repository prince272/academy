using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Workers
{
    public class StartupWorker : IHostedService
    {
        private readonly IServiceProvider serviceProvider;

        public StartupWorker(IServiceProvider services)
            => serviceProvider = services;

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();

            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

            foreach (var roleName in RoleConstants.All)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                    (await roleManager.CreateAsync(new Role { Name = roleName })).ThrowIfFailed();
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}