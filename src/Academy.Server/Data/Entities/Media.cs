using Academy.Server.Utilities;
using Humanizer;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Academy.Server.Data.Entities
{
    public class Media : IEntity
    {
        public Media(MediaType type, string name, long size)
        {
            Name = name;
            Type = type;
            Size = size;
            ContentType = MimeTypeMap.GetMimeType(name);

            var mediaTypeShortName = AttributeHelper.GetEnumAttribute<MediaType, DisplayAttribute>(type).ShortName;
            Path = $"/media" +
                          $"/{DateTimeOffset.UtcNow.Year}" +
                          $"/{type.ToString().Pluralize().ToLowerInvariant()}" +
                          $"/{mediaTypeShortName.ToUpperInvariant()}-{Compute.GenerateNumber(8)}{System.IO.Path.GetExtension(name).ToLowerInvariant()}";
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public string Path { get; set; }

        public MediaType Type { get; set; }

        public string ContentType { get; set; }

        public long Length { get; set; }

        public long Size { get; set; }
    }

    public enum MediaType
    {
        [Display(ShortName = "Aud")]
        Audio,

        [Display(ShortName = "Vid")]
        Video,

        [Display(ShortName = "Img")]
        Image,

        [Display(ShortName = "Doc")]
        Document
    }
}