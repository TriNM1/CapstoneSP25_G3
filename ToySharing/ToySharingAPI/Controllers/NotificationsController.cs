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
            // Lấy Claim NameIdentifier từ JWT token
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return -1;

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return -1;

            // Tìm user trong DB chính theo trường auth_user_id
            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return -1;

            return mainUser.Id;
        }

        // 34. Send Notification
        [HttpPost("send")]
        public async Task<ActionResult<NotificationDTO>> SendNotification(string content)
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
                CreatedDate = DateTime.UtcNow,
                ReadStatus = false // Mặc định chưa đọc
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
                    //ReadStatus = n.ReadStatus
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
                //ReadStatus = notification.ReadStatus
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