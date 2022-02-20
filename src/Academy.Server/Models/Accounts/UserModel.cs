using Academy.Server.Data.Entities;
using Academy.Server.Extensions.StorageProvider;
using Academy.Server.Models.Courses;
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

        public MediaModel Avatar { get; set; }
    }

    public class UserProfile : AutoMapper.Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserModel>();
        }
    }
}
