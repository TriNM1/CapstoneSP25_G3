using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null) return BadRequest("Email already registered!");

            var otp = new Random().Next(100000, 999999).ToString();

            var userOtp = new UserOtp
            {
                Email = request.Email,
                Otp = otp,
                ExpirationTime = DateTime.Now.AddMinutes(5)
            };

            mainContext.UserOtps.Add(userOtp);
            await mainContext.SaveChangesAsync();

            await emailService.SendEmailAsync(request.Email, "Toy Sharing OTP Code", $"Here is your OTP: {otp}");
            return Ok("OTP sent to email.");
        }

        // Xác nhận OTP 
        [HttpPost("ConfirmOTP")]
        public async Task<IActionResult> ConfirmOTP([FromBody] ConfirmOTPRequestDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userOtp = await mainContext.UserOtps
                .FirstOrDefaultAsync(o => o.Email == request.Email && o.Otp == request.OTP);

            if (userOtp == null || userOtp.ExpirationTime < DateTime.Now)
                return BadRequest("Invalid or expired OTP!");

            mainContext.UserOtps.Remove(userOtp);
            await mainContext.SaveChangesAsync();

            return Ok("OTP verified. Proceed to set password.");
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] SetPasswordDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null)
                return BadRequest("Email already registered!");

            var identityUser = new IdentityUser { UserName = request.Email, Email = request.Email };
            var result = await userManager.CreateAsync(identityUser, request.Password);
            if (!result.Succeeded)
                return BadRequest("Failed to create account!");

            await userManager.AddToRoleAsync(identityUser, "User");

            // Tạo record tương ứng trong bảng Users của DB chính
            if (!Guid.TryParse(identityUser.Id, out Guid authUserGuid))
                return BadRequest("User id format is invalid.");

            var newUser = new User
            {
                AuthUserId = authUserGuid,
                Name = request.Email,
                CreatedAt = DateTime.Now,
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
                        var mainUser = await mainContext.Users
                        .FirstOrDefaultAsync(u => u.AuthUserId == Guid.Parse(user.Id));
                        if (mainUser == null)
                        {
                            return BadRequest("Không tìm thấy người dùng trong database chính.");
                        }

                        bool isProfileCompleted =
                            !string.IsNullOrEmpty(mainUser.Phone) &&
                            !string.IsNullOrEmpty(mainUser.Address) &&
                            !string.IsNullOrEmpty(mainUser.Displayname);

                        var response = new LoginResponseDTO
                        {
                            JwtToken = jwtToken,
                            UserId = mainUser.Id,
                            IsProfileCompleted = isProfileCompleted,
                            Role = roles.FirstOrDefault()
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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await userManager.FindByEmailAsync(forgotPasswordDTO.Email);
            if (user == null) return BadRequest("There is no account registered with this email address.");

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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var user = await userManager.FindByEmailAsync(changePasswordDTO.Email);
            if (user == null) return BadRequest("Không đúng địa chỉ email!");

            var result = await userManager.ChangePasswordAsync(user, changePasswordDTO.OldPassword, changePasswordDTO.NewPassword);
            if (!result.Succeeded) return BadRequest("Mật khẩu cũ không đúng!");

            return Ok("Password changed successfully.");
        }
    }
}
