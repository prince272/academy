using Academy.Server.Data.Entities;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Models.Courses;
using Humanizer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Models.Accounts
{
    public class CurrentUserModel
    {
        public int Id { get; set; }

        public string FullName { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public bool EmailConfirmed { get; set; }

        public string PhoneNumber { get; set; }

        public bool PhoneNumberConfirmed { get; set; }

        public string[] Roles { get; set; }

        public int Bits { get; set; }

        public string Bio { get; set; }

        public decimal Balance { get; set; }

        public MediaModel Avatar { get; set; }
    }

    public class CurrentUserProfile : AutoMapper.Profile
    {
        public CurrentUserProfile(IServiceProvider serviceProvider)
        {
            var storageProvider = serviceProvider.GetRequiredService<IStorageProvider>();
            CreateMap<User, CurrentUserModel>()
                .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles.Select(ur => ur.Role.Name.Camelize())));
        }
    }
}