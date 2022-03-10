using Academy.Server.Data.Entities;
using Academy.Server.Models.Courses;

namespace Academy.Server.Models.Users
{
    public class UserModel
    {
        public int Id { get; set; }

        public string FullName { get; set; }

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
