using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using ToySharingAPI.DTO.Admin;
using ToySharingAPI.Models;
using ToySharingAPI.Service;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly AwsSettings _awsSettings;
        private readonly IAmazonS3 _s3Client;

        public AdminController(ToySharingVer3Context context, IOptions<AwsSettings> awsSettings, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
            _awsSettings = awsSettings.Value;
            var credentials = new BasicAWSCredentials(_awsSettings.AccessKey, _awsSettings.SecretKey);
            _s3Client = new AmazonS3Client(credentials, RegionEndpoint.GetBySystemName(_awsSettings.Region));
        }

        private async Task<int> GetAuthenticatedUserId()
        {
            // Kiểm tra xem User có được xác thực không
            if (!User.Identity.IsAuthenticated)
                throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                throw new UnauthorizedAccessException("Không tìm thấy thông tin xác thực người dùng.");

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                throw new UnauthorizedAccessException("ID người dùng không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                throw new UnauthorizedAccessException("Không tìm thấy người dùng trong hệ thống.");

            return mainUser.Id;
        }

        // Hàm upload ảnh lên AWS S3
        private async Task<string> UploadImageToS3(IFormFile file)
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var key = $"banners/{fileName}";
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = file.OpenReadStream(),
                Key = key,
                BucketName = _awsSettings.BucketName,
                ContentType = file.ContentType
            };

            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            return $"https://{_awsSettings.BucketName}.s3.{_awsSettings.Region}.amazonaws.com/{key}";
        }
        // Xóa ảnh từ AWS S3
        private async Task DeleteImageFromS3(string imageUrl)
        {
            var uri = new Uri(imageUrl);
            var key = uri.AbsolutePath.Substring(1); // Bỏ dấu '/' đầu tiên
            await _s3Client.DeleteObjectAsync(_awsSettings.BucketName, key);
        }

        // Xem tất cả banner
        [HttpGet("banners")]
        public async Task<ActionResult<IEnumerable<Banner>>> GetBanners()
        {
            return await _context.Banners.ToListAsync();
        }

        // Xem banner theo ID
        [HttpGet("banners/{id}")]
        public async Task<ActionResult<Banner>> GetBanner(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound("Không tìm thấy banner.");
            }
            return banner;
        }

        // Thêm banner mới
        [HttpPost("banners")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Banner>> CreateBanner([FromForm] CreateBannerDTO bannerDto)
        {
            try
            {
                var imageUrl = await UploadImageToS3(bannerDto.Image);
                var banner = new Banner
                {
                    Title = bannerDto.Title,
                    ImageUrl = imageUrl,
                    LinkUrl = bannerDto.LinkUrl,
                    Status = bannerDto.Status,
                    Priority = bannerDto.Priority,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Banners.Add(banner);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetBanner), new { id = banner.BannerId }, banner);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        // Sửa banner
        [HttpPut("banners/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBanner(int id, [FromForm] UpdateBannerDTO bannerDto)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound("Không tìm thấy banner.");
            }

            if (bannerDto.Title != null)
                banner.Title = bannerDto.Title;
            if (bannerDto.LinkUrl != null)
                banner.LinkUrl = bannerDto.LinkUrl;
            if (bannerDto.Status.HasValue)
                banner.Status = bannerDto.Status.Value;
            if (bannerDto.Priority.HasValue)
                banner.Priority = bannerDto.Priority.Value;
            if (bannerDto.Image != null)
            {
                var oldImageUrl = banner.ImageUrl;
                var newImageUrl = await UploadImageToS3(bannerDto.Image);
                banner.ImageUrl = newImageUrl;
                if (!string.IsNullOrEmpty(oldImageUrl))
                {
                    await DeleteImageFromS3(oldImageUrl);
                }
            }
            banner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Xóa banner
        [HttpDelete("banners/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound("Không tìm thấy banner.");
            }

            var imageUrl = banner.ImageUrl;
            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
            if (!string.IsNullOrEmpty(imageUrl))
            {
                await DeleteImageFromS3(imageUrl);
            }
            return NoContent();
        }

        // Xem tất cả category
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.ToListAsync();
        }

        // Xem category theo ID
        [HttpGet("categories/{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục.");
            }
            return category;
        }

        // Thêm category mới
        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] CreateCategoryDTO categoryDto)
        {
            try
            {
                var category = new Category
                {
                    CategoryName = categoryDto.CategoryName,
                };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetCategory), new { id = category.CategoryId }, category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        // Sửa category
        [HttpPut("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDTO categoryDto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục.");
            }

            if (!string.IsNullOrEmpty(categoryDto.CategoryName))
            {
                category.CategoryName = categoryDto.CategoryName;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Xóa category
        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục.");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

                var userExists = await _userManager.FindByEmailAsync(request.Email);
                if (userExists != null)
                    return BadRequest(new { message = "Email đã được đăng ký!" });

                var identityUser = new IdentityUser { UserName = request.Email, Email = request.Email };
                var result = await _userManager.CreateAsync(identityUser, request.Password);
                if (!result.Succeeded)
                    return BadRequest(new { message = "Không thể tạo tài khoản.", errors = result.Errors.Select(e => e.Description) });

                if (request.Role != "User" && request.Role != "Admin")
                    return BadRequest(new { message = "Vai trò không hợp lệ. Chỉ chấp nhận 'User' hoặc 'Admin'." });

                await _userManager.AddToRoleAsync(identityUser, request.Role);

                if (!Guid.TryParse(identityUser.Id, out Guid authUserGuid))
                    return BadRequest(new { message = "Định dạng ID người dùng không hợp lệ." });

                var newUser = new User
                {
                    AuthUserId = authUserGuid,
                    Name = request.Email,
                    Displayname = request.DisplayName,
                    CreatedAt = DateTime.Now,
                    Address = string.Empty,
                    Latitude = 0,
                    Longtitude = 0,
                    Status = 0,
                    Avatar = string.Empty,
                    Gender = request.Gender,
                    Age = 0,
                    Rating = null
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Tài khoản đã được tạo thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
            }
        }
    }
}
