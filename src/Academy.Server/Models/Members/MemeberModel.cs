using Academy.Server.Data.Entities;
using Academy.Server.Models.Courses;

namespace Academy.Server.Models.Members
{
    public class MemberModel
    {
        public int Id { get; set; }

        public string FullName { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public MediaModel Avatar { get; set; }
    }

    public class MemberProfile : AutoMapper.Profile
    {
        public MemberProfile()
        {
            CreateMap<User, MemberModel>();
        }
    }
}
