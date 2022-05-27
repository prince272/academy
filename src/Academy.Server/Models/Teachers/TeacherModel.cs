using Academy.Server.Data.Entities;
using Academy.Server.Models.Courses;

namespace Academy.Server.Models.Members
{
    public class TeacherModel
    {
        public int Id { get; set; }

        public string FullName { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        public MediaModel Avatar { get; set; }

        public string FacebookLink { get; set; }

        public string InstagramLink { get; set; }

        public string LinkedinLink { get; set; }

        public string TwitterLink { get; set; }

        public string WhatsAppLink { get; set; }
    }

    public class TeacherProfile : AutoMapper.Profile
    {
        public TeacherProfile()
        {
            CreateMap<User, TeacherModel>();
        }
    }
}
