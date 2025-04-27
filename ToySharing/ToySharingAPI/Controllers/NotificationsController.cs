using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;  

        public NotificationsController(ToySharingVer3Context context)
        {
            _context = context;
        }

        // Hàm hỗ trợ lấy mainUserId từ JWT token
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

        // 34. Send Notification
        [HttpPost("send")]
        public async Task<ActionResult<NotificationDTO>> SendNotification(string content, int Type)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");
            if (string.IsNullOrEmpty(content))
            {
                return BadRequest("Content cannot be empty.");
            }

            var notification = new Notification
            {
                UserId = mainUserId,
                Content = content,
                CreatedDate = DateTime.Now,
                ReadStatus = false,
                Type = Type,
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            var notificationDto = new NotificationDTO
            {
                NotificationId = notification.NotificationId,
                UserId = notification.UserId,
                Content = notification.Content,
                CreatedDate = notification.CreatedDate,
                //ReadStatus = notification.ReadStatus
                Type = notification.Type,
            };

            return Ok(notificationDto);
        }

        // 35. Get User Notifications
        [HttpGet("user")]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetUserNotifications()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");
            var notifications = await _context.Notifications
                .Where(n => n.UserId == mainUserId)
                .OrderByDescending(n => n.CreatedDate)
                .Select(n => new NotificationDTO
                {
                    NotificationId = n.NotificationId,
                    UserId = n.UserId,
                    Content = n.Content,
                    CreatedDate = n.CreatedDate,
                    ReadStatus = n.ReadStatus,
                    Type = n.Type,
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // 36. Mark Notification as Read
        [HttpPut("{notificationId}/read")]
        public async Task<ActionResult<NotificationDTO>> MarkNotificationAsRead(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            notification.ReadStatus = true;
            await _context.SaveChangesAsync();

            var notificationDto = new NotificationDTO
            {
                NotificationId = notification.NotificationId,
                UserId = notification.UserId,
                Content = notification.Content,
                CreatedDate = notification.CreatedDate,
                ReadStatus = notification.ReadStatus,
                Type = notification.Type
            };

            return Ok(notificationDto);
        }

        // 37. Delete Notification
        [HttpDelete("{notificationId}")]
        public async Task<IActionResult> DeleteNotification(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification deleted successfully." });
        }
    }
}