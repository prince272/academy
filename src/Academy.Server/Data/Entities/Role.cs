using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace Academy.Server.Data.Entities
{
    public class Role : IdentityRole<int>, IEntity
    {
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}