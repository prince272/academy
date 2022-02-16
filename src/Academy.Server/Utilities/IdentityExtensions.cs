using Academy.Server.Data.Entities;
using Humanizer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Utilities
{
    public static class IdentityExtensions
    {
        public static IdentityResult ThrowIfFailed(this IdentityResult result)
        {
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Unable to perform identity operation due to the following errors: {result.Errors.Select(_ => _.Code).Humanize()}.");
            }

            return result;
        }

        public static async Task<User> FindByUsernameAsync(this UserManager<User> userManager, string username)
        {
            var user = await userManager.Users.FirstOrDefaultAsync(_ => _.Email == username);
            if (user != null)
                return user;

            user = await userManager.Users.FirstOrDefaultAsync(_ => _.PhoneNumber == username);
            if (user != null)
                return user;

            return null;
        }
    }
}
