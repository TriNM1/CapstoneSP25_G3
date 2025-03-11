using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ToySharingVer3Context _context; // Đổi sang context mới

        public NotificationsController(ToySharingVer3Context context)
        {
            _context = context;
        }

        // DTO cho Notification
        public class NotificationDTO
        {
            public int NotificationId { get; set; }
            public int? UserId { get; set; }
            public string? Content { get; set; }
            public DateTime? CreatedDate { get; set; }
            public bool ReadStatus { get; set; } // BIT, không nullable
        }

        // 34. Send Notification
        [HttpPost("send")]
        public async Task<ActionResult<NotificationDTO>> SendNotification(int userId, string content)
        {
            if (string.IsNullOrEmpty(content))
            {
                return BadRequest("Content cannot be empty.");
            }

            var notification = new Notification
            {
                UserId = userId,
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
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetUserNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
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