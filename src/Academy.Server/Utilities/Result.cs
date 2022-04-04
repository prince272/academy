using Humanizer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Utilities
{
    public class Result
    {
        public object Data { get; set; }

        public ErrorInfo Error { get; set; }

        public static ObjectResult Succeed(object data = null)
        {
            var statusCode = StatusCodes.Status200OK;
            var result = new Result() { Data = data };
            return new ObjectResult(result) { StatusCode = statusCode };
        }

        public static ObjectResult Failed(int statusCode, params Error[] errors)
        {
            return Failed(statusCode, null, null, errors);
        }

        public static ObjectResult Failed(int status, string message = null, ResultReason? reason = null, params Error[] errors)
        {
            if (message == null)
            {
                if (errors.Length == 1) message = errors.ElementAt(0).Description;
                else if (errors.Length > 1) message = "One or more errors occurred.";
                else message = "Oops! Something went wrong!";
            }

            var result = new Result
            {
                Error = new ErrorInfo
                {
                    Status = status,
                    Message = message,
                    Reason = reason,
                    Details = errors.ToDictionary(error => error.Code, error => error.Description)
                }
            };
            return new ObjectResult(result) { StatusCode = status };
        }
    }

    public enum ResultReason
    {
        DuplicateUsername,
        ConfirmUsername
    }

    public class Error
    {
        public Error(object code, string description)
        {
            Code = code.ToString().Camelize();
            Description = description;
        }

        public string Code { get; set; }

        public string Description { get; set; }
    }

    public class ErrorInfo
    {
        public Dictionary<string, string> Details { get; set; }

        public int Status { get; set; }

        public ResultReason? Reason { get; set; }

        public string Message { get; set; }
    }
}