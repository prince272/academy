using Academy.Server.Data;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.SmsSender;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Services;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace Academy.Server.Controllers
{
    [ApiController]
    public class PostsController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IMapper mapper;
        private readonly IStorageProvider storageProvider;
        private readonly IDocumentProcessor documentProcessor;
        private readonly ISharedService sharedService;
        private readonly AppSettings appSettings;
        private readonly IEmailSender emailSender;
        private readonly ISmsSender smsSender;
        private readonly IViewRenderer viewRenderer;

        public PostsController(IServiceProvider serviceProvider)
        {
            unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
            mapper = serviceProvider.GetRequiredService<IMapper>();
            storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            documentProcessor = serviceProvider.GetRequiredService<IDocumentProcessor>();
            sharedService = serviceProvider.GetRequiredService<ISharedService>();
            appSettings = serviceProvider.GetRequiredService<IOptions<AppSettings>>().Value;
            emailSender = serviceProvider.GetRequiredService<IEmailSender>();
            smsSender = serviceProvider.GetRequiredService<ISmsSender>();
            viewRenderer = serviceProvider.GetRequiredService<IViewRenderer>();
        }
    }
}
