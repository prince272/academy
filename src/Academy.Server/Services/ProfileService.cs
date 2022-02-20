using System;
using System.Collections.Generic;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Academy.Server.Data.Entities;
using Academy.Server.Models.Accounts;
using Academy.Server.Utilities;
using AutoMapper;
using Humanizer;
using IdentityModel;
using IdentityServer4.AspNetIdentity;
using IdentityServer4.Extensions;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Academy.Server.Services
{
    public class AppProfileService : IProfileService
    {
        private readonly ILogger<ProfileService<User>> logger;
        private readonly IMapper mapper;
        private readonly UserManager<User> userManager;

        public AppProfileService(IServiceProvider services)
        {
            logger = services.GetRequiredService<ILogger<ProfileService<User>>>();
            mapper = services.GetRequiredService<IMapper>();
            userManager = services.GetRequiredService<UserManager<User>>();
        }

        public async Task GetProfileDataAsync(ProfileDataRequestContext context)
        {
            var sub = context.Subject?.GetSubjectId();
            if (sub == null)
            {
                throw new Exception("No sub claim present.");
            }

            var user = await userManager.Users
                .Include(_ => _.UserRoles).ThenInclude(_ => _.Role)
                .FirstOrDefaultAsync(_ => _.Id.ToString() == sub);

            if (user == null)
            {
                logger.LogWarning("No user found matching subject Id: {0}.", sub);
            }
            else
            {
                var claims = new List<Claim>
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString(CultureInfo.InvariantCulture)),
                };

                context.IssuedClaims.AddRange(claims);
            }
        }

        public async Task IsActiveAsync(IsActiveContext context)
        {
            var sub = context.Subject?.GetSubjectId();
            if (sub == null)
            {
                throw new Exception("No subject Id claim present.");
            }

            var user = await userManager.FindByIdAsync(sub);
            if (user == null)
            {
                logger.LogWarning("No user found matching subject Id: {0}.", sub);
            }

            context.IsActive = user != null;
        }
    }
}