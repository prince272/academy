using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.PaymentProcessor;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models;
using Academy.Server.Models.Courses;
using Academy.Server.Utilities;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Academy.Server.Data;
using Academy.Server.Data.Entities;
using Academy.Server.Extensions.DocumentProcessor;
using Academy.Server.Extensions.EmailSender;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Extensions.ViewRenderer;
using Academy.Server.Models.Courses;
using Academy.Server.Models.Students;
using Academy.Server.Services;
using Academy.Server.Utilities;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Academy.Server.Extensions.SmsSender;

namespace Academy.Server.Controllers
{
    [ApiController]
    public class TestController : Controller
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

        public TestController(IServiceProvider serviceProvider)
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

        [HttpGet("/test")]
        public async Task<IActionResult> Index()
        {
            string message = "Welcome to our very " +
               "first web developmen" +
               "t courses on Academy" +
               "OfOurs.com\r\n\r\n" +
               "\"Education is the p" +
               "assport to the futur" +
               "e, for tomorrow belo" +
               "ngs to those who pre" +
               "pare for it today.\"" +
               "\r\n\r\n" +
               "Get started today by" +
               " visiting academyofo" +
               "urs.com/courses\r\n" +
               "\r\n" +
               "If you have any ques" +
               "tions or would want " +
               "to study other cours" +
               "es, you can simply f" +
               "ill out the contact " +
               "form on our website.";

            string numbersString = "233550362337\r\n2332020522169";
        

            var numbers = numbersString.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries);
            var errorNumbers = new List<string>();

            foreach (var number in numbers)
            {
                try
                {
                    await smsSender.SendAsync(number, "Nice");
                }
                catch (Exception ex)
                {
                    errorNumbers.Add(number);
                }
            }



            return View();
        }
    }
}
