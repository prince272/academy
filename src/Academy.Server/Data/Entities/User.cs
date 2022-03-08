using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Data.Entities
{
    public class User : IdentityUser<int>, IEntity, IExtendable
    {
        public string Code { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string FullName => $"{FirstName} {LastName}".Trim();

        public DateTimeOffset Registered { get; set; }

        public string Bio { get; set; }

        public int Bits { get; set; }

        public decimal Balance { get; set; }

        public Media Avatar { get; set; }

        public List<CourseProgress> Progresses { get; set; } = new List<CourseProgress>();

        public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        public string ExtensionData { get; set; }

        public bool IsAdmin => UserRoles.Any(_ => _.Role.Name == RoleConstants.Admin);

        public bool IsTeacher => UserRoles.Any(_ => _.Role.Name == RoleConstants.Teacher);
    }

    public class UserRole : IdentityUserRole<int>
    {
        public virtual User User { get; set; }

        public virtual Role Role { get; set; }
    }
}