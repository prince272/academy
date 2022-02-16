using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using System;

namespace Academy.Server.Utilities
{
    public class ResultClientErrorFactory : IClientErrorFactory
    {
        public ResultClientErrorFactory()
        {
        }

        public IActionResult GetClientError(ActionContext actionContext, IClientErrorActionResult clientError)
        {
            return Result.Failed(clientError.StatusCode ?? StatusCodes.Status500InternalServerError);
        }
    }
}