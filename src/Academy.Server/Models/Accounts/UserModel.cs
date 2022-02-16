using Academy.Server.Data.Entities;
using Academy.Server.Extensions.StorageProvider;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Academy.Server.Models.Accounts
{
    public class UserModel
    {
        public int Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public int? AvatarId { get; set; }

        public string AvatarUrl { get; set; }
    }

    public class UserProfile : AutoMapper.Profile
    {
        public UserProfile(IServiceProvider serviceProvider)
        {
            var storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            CreateMap<User, UserModel>()
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Avatar != null ? storageProvider.GetUrl(src.Avatar.Path) : null));
        }
    }
}
