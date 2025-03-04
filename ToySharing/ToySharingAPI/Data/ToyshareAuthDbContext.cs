using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ToySharingAPI.Data
{
    public class ToyshareAuthDbContext : IdentityDbContext
    {
        public ToyshareAuthDbContext(DbContextOptions<ToyshareAuthDbContext> options) : base(options)
        {

        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            var userRoleId = "4a372a82-cc99-4232-b233-77bccb653527";
            var adminRoleId = "cda1066b-1aad-43f4-ae46-d91e9373d9ed";
            var roles = new List<IdentityRole>
            {
                new IdentityRole
                {
                    Id = userRoleId,
                    ConcurrencyStamp = userRoleId,
                    Name = "User",
                    NormalizedName = "User".ToUpper(),
                },
                new IdentityRole
                {
                    Id = adminRoleId,
                    ConcurrencyStamp = adminRoleId,
                    Name = "Admin",
                    NormalizedName = "Admin".ToUpper(),
                },
            };

            builder.Entity<IdentityRole>().HasData(roles);
        }

    }
}
