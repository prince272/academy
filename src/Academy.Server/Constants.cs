using Academy.Server.Data.Entities;
using Academy.Server.Utilities;
using Humanizer;
using System.ComponentModel.DataAnnotations;

namespace Academy.Server
{
    public class MediaConstants
    {
        public static string GetPath(string directoryName, MediaType mediaType, string mediaName)
        {
            var mediaTypeShortName = AttributeHelper.GetEnumAttribute<MediaType, DisplayAttribute>(mediaType).ShortName;
            string path = $"/user-content" +
                          $"/{directoryName}" +
                          $"/{mediaType.ToString().Pluralize().ToLowerInvariant()}" +
                          $"/{Compute.GenerateCode(mediaTypeShortName.ToUpperInvariant())}{System.IO.Path.GetExtension(mediaName).ToLowerInvariant()}";
            return path;
        }
    }

    public static class RoleConstants
    {
        public const string Admin = "Manager";

        public const string Teacher = "Teacher";

        public static string[] All = new string[] { Admin, Teacher };
    }
}
