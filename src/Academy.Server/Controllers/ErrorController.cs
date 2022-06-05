using Academy.Server.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;

namespace Academy.Server.Controllers
{
    [ApiController]
    [ApiExplorerSettings(IgnoreApi = true)]
    [AllowAnonymous]
    public class ErrorController : ControllerBase
    {
        [Route("/error/{statusCode}")]
        public IActionResult Error(
            [FromServices] IWebHostEnvironment webHostEnvironment, int statusCode)
        {
            var exceptionHandlerPathFeature = HttpContext.Features.Get<IExceptionHandlerPathFeature>();

            if (exceptionHandlerPathFeature?.Error is BadRequestExecption ex)
            {
                return Result.Failed(StatusCodes.Status400BadRequest, new Error(ex.ParamName, ex.Message));
            }

            return Result.Failed(statusCode);
        }
    }
}