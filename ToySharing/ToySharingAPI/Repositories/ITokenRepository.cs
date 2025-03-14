using Microsoft.AspNetCore.Identity;

namespace ToySharingAPI.Repositories
{
    public interface ITokenRepository
    {
        string CreateJWTToken(IdentityUser user, List<string> roles);
    }
}
