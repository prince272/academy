using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Academy.Server.Controllers
{
    public class ClientsController : Controller
    {
        private readonly IClientRequestParametersProvider clientRequestParametersProvider;

        public ClientsController(IServiceProvider serviceProvider)
        {
            clientRequestParametersProvider = serviceProvider.GetRequiredService<IClientRequestParametersProvider>();
        }

        [HttpGet("clients/{clientId}")]
        public IActionResult GetClientRequestParameters([FromRoute] string clientId)
        {
            var parameters = clientRequestParametersProvider.GetClientParameters(HttpContext, clientId);
            return Ok(parameters);
        }
    }
}
