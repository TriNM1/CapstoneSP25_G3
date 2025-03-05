using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ToySharingAPI.DTO;
using ToySharingAPI.Repositories;
using ToySharingAPI.Services;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> userManager;
        private readonly ITokenRepository tokenRepository;
        private readonly IEmailService emailService;
        private readonly IHttpContextAccessor httpContextAccessor;

        public AuthController(UserManager<IdentityUser> userManager, ITokenRepository tokenRepository, IEmailService emailService,
            IHttpContextAccessor httpContextAccessor)
        {
            this.userManager = userManager;
            this.tokenRepository = tokenRepository;
            this.emailService = emailService;
            this.httpContextAccessor = httpContextAccessor;
        }

        [HttpPost("RequestOTP")]
        public async Task<IActionResult> RequestOTP([FromBody] OTPRequestDTO request)
        {
            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null) return BadRequest("Email already registered!");

            var otp = new Random().Next(100000, 999999).ToString();

            httpContextAccessor.HttpContext.Session.SetString(request.Email, otp);

            await emailService.SendEmailAsync(request.Email, "OTP Code", $"Your OTP: {otp}");
            return Ok("OTP sent to email.");
        }

        [HttpPost("ConfirmOTP")]
        public IActionResult ConfirmOTP([FromBody] ConfirmOTPRequestDTO request)
        {
            var savedOTP = HttpContext.Session.GetString(request.Email);
            if (savedOTP == null || savedOTP != request.OTP) return BadRequest("Invalid OTP!");

            return Ok("OTP verified. Proceed to set password.");
        }

        [HttpPost("SetPassword")]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordDTO request)
        {
            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null) return BadRequest("Email already registered!");

            var identityUser = new IdentityUser { UserName = request.Email, Email = request.Email };
            var result = await userManager.CreateAsync(identityUser, request.Password);
            if (!result.Succeeded) return BadRequest("Failed to create account!");

            await userManager.AddToRoleAsync(identityUser, "User");
            return Ok("Account created successfully.");
        }

        [HttpPost]
        [Route("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO loginRequestDTO)
        {
            var user = await userManager.FindByEmailAsync(loginRequestDTO.Username);
            if (user != null)
            {
                var checkPasswordResult = await userManager.CheckPasswordAsync(user, loginRequestDTO.Password);

                if (checkPasswordResult)
                {
                    // Get roles for this user
                    var roles = await userManager.GetRolesAsync(user);
                    if (roles != null)
                    {
                        // Create Token
                        var jwtToken = tokenRepository.CreateJWTToken(user, roles.ToList());
                        var response = new LoginResponseDTO
                        {
                            JwtToken = jwtToken
                        };
                        return Ok(response);
                    }

                }
            }
            return BadRequest("Username or password incorrect");
        }

        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            return Ok(new { Message = "Logout successful" });
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO forgotPasswordDTO)
        {
            var user = await userManager.FindByEmailAsync(forgotPasswordDTO.Email);
            if (user == null) return BadRequest("Email not exist!");

            var newPassword = Guid.NewGuid().ToString().Substring(0, 8);
            await userManager.RemovePasswordAsync(user);
            await userManager.AddPasswordAsync(user, newPassword);

            await emailService.SendEmailAsync(user.Email, "New password", $"Your new password: {newPassword}");

            return Ok("A new password has been sent to your email.");
        }

        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO changePasswordDTO)
        {
            var user = await userManager.FindByEmailAsync(changePasswordDTO.Email);
            if (user == null) return BadRequest("Email does not exist!");

            var result = await userManager.ChangePasswordAsync(user, changePasswordDTO.OldPassword, changePasswordDTO.NewPassword);
            if (!result.Succeeded) return BadRequest("Password change failed!");

            return Ok("Password changed successfully.");
        }
    }
}
