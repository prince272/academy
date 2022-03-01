﻿using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Academy.Server.Data.Entities
{
    public class User : IdentityUser<int>, IEntity, IExtendable
    {
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

        public bool CanManageCourses()
        {
            var canManage = UserRoles.Any(_ => _.Role.Name == RoleNames.Manager) || UserRoles.Any(_ => _.Role.Name == RoleNames.Teacher);
            return canManage;
        }

        public bool CanManageCourse(Course course)
        {
            var canManage = (UserRoles.Any(_ => _.Role.Name == RoleNames.Manager)) ||
                           ((UserRoles.Any(_ => _.Role.Name == RoleNames.Teacher)) && Id == course.UserId);
            return canManage;
        }
    }

    public class UserRole : IdentityUserRole<int>
    {
        public virtual User User { get; set; }

        public virtual Role Role { get; set; }
    }
}