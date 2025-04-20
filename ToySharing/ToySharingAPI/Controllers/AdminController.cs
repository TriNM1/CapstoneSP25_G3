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
        private readonly AwsSettings _awsSettings;
        private readonly IAmazonS3 _s3Client;

        public AdminController(ToySharingVer3Context context, IOptions<AwsSettings> awsSettings)
        {
            _context = context;
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
    }
}
