using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ToySharingAPI.Repositories
{
    public class TokenRepository : ITokenRepository
    {
        private readonly IConfiguration configuration;
        private static ConcurrentDictionary<string, DateTime> _revokedTokens = new ConcurrentDictionary<string, DateTime>();

        public TokenRepository(IConfiguration configuration)
        {
            this.configuration = configuration;
        }
        public string CreateJWTToken(IdentityUser user, List<string> roles)
        {
            // Create claims
            var claim = new List<Claim>();
            claim.Add(new Claim(ClaimTypes.NameIdentifier, user.Id));
            claim.Add(new Claim(ClaimTypes.Email, user.Email));

            foreach (var role in roles)
            {
                claim.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                configuration["Jwt:Issuer"],
                configuration["Jwt:Audience"],
                claim,
                expires: DateTime.Now.AddMinutes(15),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool IsTokenRevoked(string token)
        {
            return _revokedTokens.ContainsKey(token);
        }

        public async Task RevokeTokenAsync(string token)
        {
            _revokedTokens.TryAdd(token, DateTime.UtcNow);
            await Task.CompletedTask;
        }
    }
}
