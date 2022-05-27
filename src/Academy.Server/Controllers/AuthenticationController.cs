using Academy.Server.Data.Entities;
using Academy.Server.Models.Accounts;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [Route("[controller]")]
    public class AuthenticationController : Controller
    {
        private readonly UserManager<User> userManager;
        private readonly SignInManager<User> signInManager;

        public AuthenticationController(IServiceProvider serviceProvider)
        {
            userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            signInManager = serviceProvider.GetRequiredService<SignInManager<User>>();
        }

        [HttpGet("redirect")]
        public IActionResult InternalRedirect(string returnUrl)
        {
            if (returnUrl == null) return BadRequest();

            return Redirect(returnUrl);
        }

        [HttpPost("{provider}")]
        public IActionResult External([FromRoute] string provider, string returnUrl)
        {
            if (returnUrl == null) return BadRequest();

            // Request a redirect to the external login provider.
            var redirectUrl =  Url.ActionLink(nameof(ExternalCallback), values: new { provider, returnUrl });
            var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
            return Challenge(properties, provider);
        }

        [HttpGet("{provider}/callback")]
        public async Task<IActionResult> ExternalCallback([FromRoute] string provider, string returnUrl)
        {
            if (returnUrl == null) return BadRequest();

            var signinInfo = await signInManager.GetExternalLoginInfoAsync();

            if (signinInfo != null)
            {
                var signInResult = await signInManager.ExternalLoginSignInAsync(signinInfo.LoginProvider, signinInfo.ProviderKey, isPersistent: false, bypassTwoFactor: true);

                var email = signinInfo.Principal.FindFirstValue(ClaimTypes.Email);

                if (!string.IsNullOrWhiteSpace(email))
                {
                    var user = await userManager.FindByEmailAsync(email);

                    if (user != null)
                    {
                        await userManager.RemoveLoginAsync(user, signinInfo.LoginProvider, signinInfo.ProviderKey);
                        var result = await userManager.AddLoginAsync(user, signinInfo);

                        if (result.Succeeded)
                        {
                            await signInManager.SignOutAsync();
                            await signInManager.SignInAsync(user, isPersistent: true);
                            return Redirect(returnUrl);
                        }
                    }
                    else
                    {
                        var firstName = signinInfo.Principal.FindFirstValue(ClaimTypes.GivenName);
                        var lastName = signinInfo.Principal.FindFirstValue(ClaimTypes.Surname);
                        var phoneNumber = signinInfo.Principal.FindFirstValue(ClaimTypes.MobilePhone);

                        user = new User();
                        user.Email = email;
                        user.EmailConfirmed = true;
                        user.FirstName = firstName;
                        user.LastName = lastName;
                        user.UserName = await Compute.GenerateSlugAsync($"{firstName} {lastName}", slug => userManager.Users.AnyAsync(_ => _.UserName == slug));
                        user.Registered = DateTimeOffset.UtcNow;
                        user.Code = Compute.GenerateCode("USER");

                        (await userManager.CreateAsync(user, Guid.NewGuid().ToString())).ThrowIfFailed();

                        if (await userManager.Users.CountAsync() == 1)
                        {
                            (await userManager.AddToRolesAsync(user, new string[] { RoleConstants.Teacher, RoleConstants.Admin })).ThrowIfFailed();
                        }

                        var result = await userManager.AddLoginAsync(user, signinInfo);

                        if (result.Succeeded)
                        {
                            await signInManager.SignOutAsync();
                            await signInManager.SignInAsync(user, isPersistent: true);
                            return Redirect(returnUrl);
                        }
                    }
                }
            }

            return BadRequest();
        }
    }
}
