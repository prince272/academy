using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace Academy.Server.Utilities
{
    public class BadRequestExecption : Exception
    {
        /// <summary>
        ///  Initializes a new instance of the BadRequestExecption class with a specified
        ///  error message and the exception that is the cause of this exception.
        /// </summary>
        /// <param name="message">The error message that explains the reason for this exception.</param>
        /// <param name="paramName">The name of the parameter that caused the exception.</param>
        public BadRequestExecption(string message, string paramName) : base(message)
        {
            ParamName = paramName;
        }

        /// <summary>
        ///  The name of the parameter that caused the exception.
        /// </summary>
        public string ParamName { get; set; }
    }
}
