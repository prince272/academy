using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Utilities
{
    public static class ModelStateExtensions
    {
        public static Dictionary<string, string> ToErrorFields(this ModelStateDictionary modelState)
        {
            var errors = modelState.Where(modelState => modelState.Value.ValidationState == ModelValidationState.Invalid).Select(modelState =>
            {
                var key = modelState.Key;
                var value = modelState.Value.Errors.FirstOrDefault()?.ErrorMessage;

                return new { key, value };
            }).ToDictionary(x => x.key, x => x.value);
            return errors;
        }
    }
}
