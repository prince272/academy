using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Middlewares;
using Academy.Server.Services;
using Academy.Server.Utilities;
using Academy.Server.Workers;
using AutoMapper;
using FluentValidation.AspNetCore;
using Humanizer;
using IdentityModel;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using Syncfusion.Licensing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Academy.Server
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IWebHostEnvironment webEnvironment)
        {
            Configuration = configuration;
            WebEnvironment = webEnvironment;
        }

        public IConfiguration Configuration { get; }

        public IWebHostEnvironment WebEnvironment { get; }


        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var webLink = Configuration.GetSection("IdentityServer:Clients:Web").GetValue<string>("Origin");

            services.Configure<AppSettings>(options =>
            {
                options.Media = new MediaInfo
                {
                    Rules = new List<MediaRule>
                    {
                        new MediaRule(MediaType.Image, new [] { ".jpg", ".jpeg", ".png" }, 5242880L), // Image - 5MB
                        new MediaRule(MediaType.Video, new [] { ".mp4", ".webm", ".swf", ".flv" }, 524288000L), // Video - 500MB
                        new MediaRule(MediaType.Audio, new [] { ".mp3", ".ogg", ".wav" }, 83886080L), // Audio - 80MB
                        new MediaRule(MediaType.Document, new[] { ".doc", ".docx", ".rtf", ".pdf", ".json" }, 83886080L), // Document - 80MB
                    }
                };

                options.Company = new CompanyInfo
                {
                    Name = "Academy of Ours",
                    Description = "Academy of Ours is an e-learning platform that helps you to learn a variety of courses and concepts through interactive checkpoints, lessons, and videos with certificates awarded automatically after each course.",
                    PlatformDescription = "Academy of Ours is an e-learning platform that helps you to learn a variety of courses and concepts through interactive checkpoints, lessons, and videos with certificates awarded automatically after each course.",
                    Established = DateTimeOffset.Parse("2021-11-08"),
                    Address = "4 Agbaamo St, Accra, Ghana",


                    Emails = new EmailsInfo
                    {
                        App = new EmailAccount
                        {
                            Username = "princeowusu.272@gmail.com",
                            Password = "dhouphrhpazvollb",
                            DisplayName = "Academy Of Ours",
                            Email = "princeowusu.272@gmail.com"
                        },
                        Support = new EmailAccount
                        {
                            Username = "princeowusu.272@gmail.com",
                            Password = "dhouphrhpazvollb",
                            DisplayName = "Prince from Academy Of Ours",
                            Email = "princeowusu.272@gmail.com"
                        }
                    },

                    PhoneNumber = "+233550362337",

                    WebLink = webLink,
                    MapLink = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d75551.8964035619!2d-0.19444572554201875!3d5.610157527892059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9b079dcc55cf%3A0x373d56b9a01d602d!2s4%20Agbaamo%20St%2C%20Accra!5e0!3m2!1sen!2sgh!4v1595846305553!5m2!1sen!2sgh",
                    FacebookLink = "https://www.facebook.com/princeowusu272/",
                    InstagramLink = "",
                    LinkedinLink = "",
                    TwitterLink = "",
                    YoutubeLink = "",

                    Country = "Ghana",
                    CountryCode = "GH",
                    Province = "Greater Accra",
                    ProvinceCode = "GA",

                    CourseRate = 0.15m
                };

                options.Currency = new CurrencyInfo
                {
                    Name = "Ghanaian cedi",
                    Code = "GHS",
                    Symbol = "₵",
                    Limit = 1000,

                    BitRules = new List<BitRule>
                    {
                        new BitRule(BitRuleType.CompleteLesson, 10, "Complete a lesson"),
                        new BitRule(BitRuleType.AnswerCorrectly, 5, "Answer question correctly"),
                        new BitRule(BitRuleType.AnswerWrongly, -15, "Answer question wrongly"),
                        new BitRule(BitRuleType.SkipQuestion, -5, "Skip question")
                    }
                };
            });

            services.AddScoped(provider => new MapperConfiguration(options =>
            {
                // Since auto mapper does not provide dependency injection for profiles out of the box,
                // we manually inject the service provider if the profile doesn't provide a parameterless constructor.
                var profileTypes = TypeHelper.FindDerivedTypes(Assembly.GetExecutingAssembly(), typeof(AutoMapper.Profile));

                foreach (var profileType in profileTypes)
                {
                    // How do I check if a type provides a parameterless constructor?
                    // source: https://stackoverflow.com/questions/4681031/how-do-i-check-if-a-type-provides-a-parameterless-constructor
                    var profile = (AutoMapper.Profile)(profileType.GetConstructor(Type.EmptyTypes) != null ?
                                 Activator.CreateInstance(profileType) :
                                 Activator.CreateInstance(profileType, provider));

                    options.AddProfile(profile);
                }
            }).CreateMapper());

            services.AddRouting(options =>
            {
                options.LowercaseUrls = true;
                options.LowercaseQueryStrings = false;
                options.ConstraintMap["slugify"] = typeof(SlugifyParameterTransformer);
            });

            services.AddCors(options =>
            {
                options.AddDefaultPolicy(builder =>
                {
                    var allowedOrigins = Configuration
                    .GetSection("IdentityServer:Clients")
                    .GetChildren()
                    .Select(_ => _.GetValue<string>("Origin"))
                    .ToArray();

                    builder
                    .WithOrigins(allowedOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .WithExposedHeaders("Content-Disposition");
                });
            });

            services.AddControllers(options =>
            {


            })
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.Converters.Add(new StringEnumConverter(new CamelCaseNamingStrategy
                    {
                        ProcessDictionaryKeys = true,
                        ProcessExtensionDataNames = true,
                    }));

                    options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                    options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                })
                .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = actionContext =>
                {
                    var errors = actionContext.ModelState.ToErrorFields().Select(pair => new Error(pair.Key, pair.Value)).ToArray();
                    return Result.Failed(StatusCodes.Status400BadRequest, errors);
                };
            });

            services.AddDistributedMemoryCache();
            services.AddSession();

            services.AddSingleton<IClientErrorFactory, ResultClientErrorFactory>();

            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "Academy.Server", Version = "v1" });
            });

            services.AddMediatR(Assembly.GetExecutingAssembly());

            services.AddFluentValidation(options =>
            {
                options.RegisterValidatorsFromAssembly(Assembly.GetExecutingAssembly());
                options.ValidatorOptions.DisplayNameResolver = (type, memberInfo, expression) =>
                {
                    string ResolveDisplayName(string propertyName) => propertyName?.Humanize();

                    if (expression != null)
                    {
                        var chain = FluentValidation.Internal.PropertyChain.FromExpression(expression);
                        if (chain.Count > 0) return ResolveDisplayName(chain.ToString());
                    }

                    return ResolveDisplayName(memberInfo.Name);
                };
            });

            services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = Configuration.GetConnectionString("DefaultConnection");
                var migrationAssembly = Assembly.GetExecutingAssembly().GetName().Name;

                // Configure the context to use Microsoft SQL Server.
                options.UseSqlServer(connectionString, sql => sql.MigrationsAssembly(migrationAssembly));
            });

            services.AddTransient<IUnitOfWork, UnitOfWork<AppDbContext>>();

            services.AddIdentity<User, Role>(options =>
            {
                // Password settings.
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 0;
                options.Password.RequiredUniqueChars = 0;

                // Lockout settings.
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings.
                options.User.AllowedUserNameCharacters = null;
                options.User.RequireUniqueEmail = false;

                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;
                options.SignIn.RequireConfirmedPhoneNumber = false;

                // Generate Short Code for Email Confirmation using Asp.Net Identity core 2.1
                // source: https://stackoverflow.com/questions/53616142/generate-short-code-for-email-confirmation-using-asp-net-identity-core-2-1
                options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
                options.Tokens.ChangeEmailTokenProvider = TokenOptions.DefaultEmailProvider;
                options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;

                // Configure Identity to use the same JWT claims as IdentityServer4 instead
                // of the legacy WS-Federation claims it uses by default (ClaimTypes),
                // which saves you from doing the mapping in your authorization controller.
                options.ClaimsIdentity.UserNameClaimType = JwtClaimTypes.Name;
                options.ClaimsIdentity.UserIdClaimType = JwtClaimTypes.Subject;
                options.ClaimsIdentity.RoleClaimType = JwtClaimTypes.Role;
            })
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            services.AddIdentityServer(options =>
            {
                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseInformationEvents = true;
                options.Events.RaiseFailureEvents = true;
                options.Events.RaiseSuccessEvents = true;
            })
                .AddApiAuthorization<User, AppDbContext>();

            services.AddAuthentication()
                .AddIdentityServerJwt();

            services.AddResponseCompression();

            services.ConfigureApplicationCookie(options =>
            {
                // Cookie settings
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.None;
                options.ExpireTimeSpan = TimeSpan.FromDays(360);
                options.SlidingExpiration = true;
                options.LoginPath = "/accounts/signin";
                options.LogoutPath = "/accounts/signout";


                // Not creating a new object since ASP.NET Identity has created
                // one already and hooked to the OnValidatePrincipal event.
                // See https://github.com/aspnet/AspNetCore/blob/5a64688d8e192cacffda9440e8725c1ed41a30cf/src/Identity/src/Identity/IdentityServiceCollectionExtensions.cs#L56
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });

            services.AddHostedService<StartupWorker>();


            services.AddScoped<ISharedService, SharedService>();

            services.AddLocalStorageProvider(options =>
            {
                options.RootPath = WebEnvironment.WebRootPath;
            });

            services.AddWordDocumentProcessor();

            services.AddSmtpEmailSender(options =>
            {
                options.Hostname = "smtp.gmail.com";
                options.Port = 587;
                options.UseServerCertificateValidation = true;
                options.SecureSocketOptionsId = 1;
            });

            services.AddSmsSender(options => { });

            services.AddRazorViewRenderer(options =>
            {
                options.RootPathFormat = "/Views/Templates/{0}";
            });

            services.AddPaySwitchPaymentProcessor(options =>
            {
                options.ClientId = "neimart5f4d2b7fb7841";
                options.ClientSecret = "YTI1NzM5ZjNlNWQ1ZmM0YjU5NWM5NGU5MTk2OWVmOTg=";

                options.MerchantId = "TTM-00004303";
                options.MerchantSecret = "4547088902741e671744f2eaff4f341d";
            });

            services.AddMemoryCacheManager(options =>
            {
                options.CacheTime = TimeSpan.FromMinutes(30);
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app)
        {
            // Register Syncfusion license.
            SyncfusionLicenseProvider.RegisterLicense("NTY0NTk4QDMxMzkyZTM0MmUzMFE0Ni93eHhJNjcvQ29ySG1VTGlzb1JLaFdEakJaQkRDQWppSkhmenZxNFk9");

            app.UseExceptionHandler(_ => _.Run(async context =>
            {
                var statusCode = StatusCodes.Status500InternalServerError;
                var response = Result.Failed(statusCode);
                context.Response.StatusCode = statusCode;
                await context.Response.WriteAsJsonAsync(response.Value);
            }));

            if (WebEnvironment.IsDevelopment())
            {
                // app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Academy.Server v1"));
            }

            app.UseHttpsRedirection();

            app.UseResponseCompression();

            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors();

            app.UseAuthentication();
            app.UseIdentityServer();
            app.UseAuthorization();

            app.UseSession();

            app.UseDatabaseTransaction();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "Index",
                    pattern: "{action:slugify=Index}/{id?}",
                    defaults: new { controller = "Index" });

                endpoints.MapControllerRoute(
                    name: "Default",
                    pattern: "{controller:slugify}/{action:slugify=Index}/{id?}");
            });
        }
    }
}