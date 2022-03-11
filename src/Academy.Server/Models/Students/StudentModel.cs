using Academy.Server.Data.Entities;
using Academy.Server.Models.Courses;

namespace Academy.Server.Models.Students
{
    public class StudentModel
    {
        public int Id { get; set; }

        public string FullName { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public MediaModel Avatar { get; set; }
    }

    public class StudentProfile : AutoMapper.Profile
    {
        public StudentProfile()
        {
            CreateMap<User, StudentModel>();
        }
    }
}
