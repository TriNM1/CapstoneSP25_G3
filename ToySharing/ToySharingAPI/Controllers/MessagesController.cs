using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO.ChatDTO;
using ToySharingAPI.Hubs;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/conversations/{conversationId}/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public MessagesController(ToySharingVer3Context context, IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _chatHubContext = chatHubContext;
        }

        // GET: api/conversations/{conversationId}/messages?page=1&pageSize=10
        // Lấy danh sách tin nhắn của một cuộc trò chuyện
        [HttpGet]
        public async Task<IActionResult> GetMessages(int conversationId, int page = 1, int pageSize = 10)
        {
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.ConversationId == conversationId);
            if (conversation == null)
                return NotFound("Cuộc trò chuyện không tồn tại.");

            if (conversation.User1Id != mainUser.Id && conversation.User2Id != mainUser.Id)
                return Unauthorized("Bạn không có quyền truy cập cuộc trò chuyện này.");

            // Lấy danh sách tin nhắn của cuộc trò chuyện với phân trang và chuyển đổi sang DTO
            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new MessageDTO
                {
                    MessageId = m.MessageId,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId.GetValueOrDefault(),
                    Content = m.Content,
                    SentAt = m.SentAt.GetValueOrDefault(),
                    IsRead = m.IsRead.GetValueOrDefault()
                })
                .ToListAsync();

            return Ok(messages);
        }

        // POST: api/conversations/{conversationId}/messages
        // Gửi tin nhắn mới vào cuộc trò chuyện.
        [HttpPost]
        public async Task<IActionResult> SendMessage(int conversationId, [FromBody] SendMessageRequestDTO request)
        {
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            int mainUserId = mainUser.Id;

            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.ConversationId == conversationId);
            if (conversation == null)
                return NotFound("Cuộc trò chuyện không tồn tại.");

            if (conversation.User1Id != mainUserId && conversation.User2Id != mainUserId)
                return Unauthorized("Người dùng không thuộc cuộc trò chuyện.");

            var message = new Message
            {
                ConversationId = conversationId,
                SenderId = mainUserId,
                Content = request.Content,
                SentAt = DateTime.Now,
                IsRead = false
            };

            _context.Messages.Add(message);
            conversation.LastMessageAt = DateTime.Now;
            await _context.SaveChangesAsync();

            // Xác định receiverId (integer Id từ bảng Users)
            var receiverId = (conversation.User1Id == mainUserId) ? conversation.User2Id : conversation.User1Id;

            // Lấy AuthUserId (GUID) của receiver từ bảng Users
            var receiver = await _context.Users.FirstOrDefaultAsync(u => u.Id == receiverId);
            if (receiver == null)
                return NotFound("Không tìm thấy người nhận.");

            string receiverAuthUserId = receiver.AuthUserId.ToString();

            // Gửi thông báo SignalR bằng receiverAuthUserId (GUID string)
            Console.WriteLine($"Sending to {receiverAuthUserId} with messageId {message.MessageId}");
            await _chatHubContext.Clients.User(receiverAuthUserId)
                .SendAsync("ReceiveMessage", conversationId, mainUserId, request.Content, message.SentAt, message.MessageId);

            var responseDTO = new MessageResponseDTO
            {
                MessageId = message.MessageId,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId.GetValueOrDefault(),
                Content = message.Content,
                SentAt = message.SentAt.GetValueOrDefault(),
                IsRead = message.IsRead.GetValueOrDefault()
            };

            return Ok(responseDTO);
        }

        // PUT: api/conversations/{conversationId}/messages/{messageId}
        // Cập nhật nội dung tin nhắn
        [HttpPut("{messageId}")]
        public async Task<IActionResult> UpdateMessage(int conversationId, int messageId, [FromBody] UpdateMessageRequestDTO request)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.ConversationId == conversationId);
            if (conversation == null)
                return NotFound("Cuộc trò chuyện không tồn tại.");

            var message = await _context.Messages.FirstOrDefaultAsync(m => m.MessageId == messageId && m.ConversationId == conversationId);
            if (message == null)
                return NotFound("Tin nhắn không tồn tại trong cuộc trò chuyện này.");

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            int mainUserId = mainUser.Id;

            if (message.SenderId != mainUserId)
                return Unauthorized("Bạn không có quyền cập nhật tin nhắn này.");

            message.Content = request.Content;
            await _context.SaveChangesAsync();

            var responseDTO = new MessageResponseDTO
            {
                MessageId = message.MessageId,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId.GetValueOrDefault(),
                Content = message.Content,
                SentAt = message.SentAt.GetValueOrDefault(),
                IsRead = message.IsRead.GetValueOrDefault()
            };

            return Ok(responseDTO);
        }

        // PUT: api/conversations/{conversationId}/messages/{messageId}/read
        // Cập nhật trạng thái tin nhắn đã đọc
        [HttpPut("{messageId}/read")]
        public async Task<IActionResult> MarkMessageAsRead(int conversationId, int messageId)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.MessageId == messageId && m.ConversationId == conversationId);
            if (message == null)
                return NotFound("Tin nhắn không tồn tại trong cuộc trò chuyện này.");

            message.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


