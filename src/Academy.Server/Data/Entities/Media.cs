using Academy.Server.Utilities;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Academy.Server.Data.Entities
{
    public class Media : IEntity
    {
        public Media()
        {
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public string Path { get; set; }

        public MediaType Type { get; set; }

        public string ContentType { get; set; }

        public long? Duration { get; set; }

        public int? Width { get; set; }

        public int? Height { get; set; }

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