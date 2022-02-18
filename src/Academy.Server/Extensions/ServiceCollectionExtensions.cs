using Academy.Server.Extensions.CacheManager;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using System;
using System.Net;
using System.Net.Http;

namespace Academy.Server.Services
{
    public static class ServiceCollectionExtensions
    {
        public static void AddLocalStorageProvider(this IServiceCollection services, Action<LocalStorageOptions> configure)
        {
            services.Configure(configure);
            services.AddScoped<IStorageProvider, LocalStorageProvider>();
        }

        public static void AddWordDocumentProcessor(this IServiceCollection services)
        {
            services.AddScoped<IDocumentProcessor, WordDocumentProcessor>();
        }

        public static void AddSmtpEmailSender(this IServiceCollection services, Action<SmtpEmailSenderOptions> configure)
        {
            services.Configure(configure);
            services.AddScoped<IEmailSender, SmtpEmailSender>();
        }

        public static void AddRazorViewRenderer(this IServiceCollection services, Action<RazorViewRendererOptions> configure)
        {
            services.Configure(configure);

            var options = services.BuildServiceProvider().GetRequiredService<IOptions<RazorViewRendererOptions>>();

            var builder = services.AddMvcCore();
            builder.AddRazorViewEngine(viewEngineOptions =>
            {
                viewEngineOptions.ViewLocationFormats.Add($"{options.Value.RootPathFormat}{RazorViewEngine.ViewExtension}");
            });
            services.TryAddSingleton<IActionContextAccessor, ActionContextAccessor>();
            services.AddScoped<IViewRenderer, RazorViewRenderer>();
        }

        public static void AddPaySwitchPaymentProcessor(this IServiceCollection services, Action<PaySwitchPaymentOptions> configure)
        {
            services.Configure(configure);

            services.AddHttpClient(nameof(PaySwitchPaymentProcessor))
                   .ConfigurePrimaryHttpMessageHandler(_ =>
                   {
                       var handler = new HttpClientHandler();
                       if (handler.SupportsAutomaticDecompression)
                       {
                           handler.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
                       }

                       return handler;
                   });

            services.AddScoped<IPaymentProcessor, PaySwitchPaymentProcessor>();
            services.AddHostedService<PaySwitchPaymentHostedService>();
        }

        public static void AddMemoryCacheManager(this IServiceCollection services, Action<MemoryCacheManagerOptions> configure)
        {
            services.Configure(configure);
            services.AddMemoryCache();
            services.AddScoped<ICacheManager, MemoryCacheManager>();
        }
    }
}