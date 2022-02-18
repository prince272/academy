using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Data.Entities
{
    public class User : IdentityUser<int>, IEntity
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string FullName => $"{FirstName} {LastName}".Trim();

        public DateTimeOffset Registered { get; set; }

        public string Bio { get; set; }

        public int Bits { get; set; }

        public Media Avatar { get; set; }

        public int? AvatarId { get; set; }

        public List<Progress> Progresses { get; set; } = new List<Progress>();

        public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        public bool CanManageCourse(Course course)
        {
            var canManage = (UserRoles.Any(_ => _.Role.Name == RoleNames.Manager)) ||
                           ((UserRoles.Any(_ => _.Role.Name == RoleNames.Teacher)) && Id == course.UserId);
            return canManage;
        }
    }

    public class Certificate : IEntity
    {
        public virtual User User { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public int Id { get; set; }

        public Media Image { get; set; }

        public Media Document { get; set; }
    }

    public class UserRole : IdentityUserRole<int>
    {
        public virtual User User { get; set; }

        public virtual Role Role { get; set; }
    }

    public class Progress
    {
        public Progress(ProgressType type, int id)
        {
            Type = type;
            Id = id;
        }

        public ProgressType Type { get; set; }

        public int Id { get; set; }

        public bool Completed { get; set; }

        public bool Force => Choices.FirstOrDefault()?.Skip ?? false;

        public List<Choice> Choices { get; set; } = new List<Choice>();

        public class Choice
        {
            public Choice(bool skip, string[] answers)
            {
                Skip = skip;
                Answers = answers;
            }

            public bool Skip { get; set; }

            public string[] Answers { get; set; }
        }
    }


    public enum ProgressType
    {
        Lesson,
        Question
    }
}