using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;
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
        private readonly ToySharingVer3Context mainContext;

        public AuthController(UserManager<IdentityUser> userManager, ITokenRepository tokenRepository, IEmailService emailService,
            IHttpContextAccessor httpContextAccessor, ToySharingVer3Context mainContext)
        {
            this.userManager = userManager;
            this.tokenRepository = tokenRepository;
            this.emailService = emailService;
            this.httpContextAccessor = httpContextAccessor;
            this.mainContext = mainContext;
        }
        // Nhập email đăng ký
        [HttpPost("RequestOTP")]
        public async Task<IActionResult> RequestOTP([FromBody] OTPRequestDTO request)
        {
            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null) return BadRequest("Email already registered!");

            var otp = new Random().Next(100000, 999999).ToString();


            HttpContext.Session.SetString("RegistrationEmail", request.Email);
            HttpContext.Session.SetString("RegistrationOTP", otp);

            await emailService.SendEmailAsync(request.Email, "Toy Sharing OTP Code", $"Here is your OTP: {otp}");
            return Ok("OTP sent to email.");
        }

        // Xác nhận OTP 
        [HttpPost("ConfirmOTP")]
        public IActionResult ConfirmOTP([FromBody] ConfirmOTPRequestDTO request)
        {
            var savedOTP = HttpContext.Session.GetString("RegistrationOTP");
            if (savedOTP == null || savedOTP != request.OTP)
                return BadRequest("Invalid OTP!");

            HttpContext.Session.SetString("OTPConfirmed", "true");
            return Ok("OTP verified. Proceed to set password.");
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] SetPasswordDTO request)
        {
            var otpConfirmed = HttpContext.Session.GetString("OTPConfirmed");
            if (otpConfirmed != "true")
                return BadRequest("OTP not confirmed.");

            var email = HttpContext.Session.GetString("RegistrationEmail");
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email session expired or not set.");

            var userExists = await userManager.FindByEmailAsync(email);
            if (userExists != null) return BadRequest("Email already registered!");

            // Tạo IdentityUser ở bảng AspNetUsers
            var identityUser = new IdentityUser { UserName = email, Email = email };
            var result = await userManager.CreateAsync(identityUser, request.Password);
            if (!result.Succeeded) return BadRequest("Failed to create account!");

            await userManager.AddToRoleAsync(identityUser, "User");

            // Tạo record tương ứng trong bảng Users của DB chính
            if (!Guid.TryParse(identityUser.Id, out Guid authUserGuid))
                return BadRequest("User id format is invalid.");

            var newUser = new User
            {
                AuthUserId = authUserGuid,
                Name = email,
                CreatedAt = DateTime.UtcNow,
                Address = string.Empty,
                Latitude = 0,
                Longtitude = 0,
                Status = 0,
                Avatar = string.Empty,
                Gender = true,
                Age = 0,
                Rating = null
            };

            mainContext.Users.Add(newUser);
            await mainContext.SaveChangesAsync();

            HttpContext.Session.Remove("RegistrationEmail");
            HttpContext.Session.Remove("RegistrationOTP");
            HttpContext.Session.Remove("OTPConfirmed");

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
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var token = HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            await tokenRepository.RevokeTokenAsync(token);

            HttpContext.Session.Clear();

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

            await emailService.SendEmailAsync(user.Email, "Toy Sharing reset password", $"Your new password is: {newPassword}");

            return Ok("A new password has been sent to your email.");
        }

        [HttpPost("ChangePassword")]
        [Authorize]
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
