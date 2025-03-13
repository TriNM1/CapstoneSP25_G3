using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO.ChatDTO;
using ToySharingAPI.Hubs;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/conversations/{conversationId}/[controller]")]
    [ApiController]
    //    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public MessagesController(ToySharingVer3Context context, IHubContext<ChatHub> chatHubContext)
        {
            _context = context;
            _chatHubContext = chatHubContext;
        }

        // GET: api/conversations/{conversationId}/messages?page=1&pageSize=20
        // Lấy danh sách tin nhắn của một cuộc trò chuyện
        [HttpGet]
        public async Task<IActionResult> GetMessages(int conversationId, int page = 1, int pageSize = 20)
        {
            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return Ok(messages);
        }

        // POST: api/conversations/{conversationId}/messages
        // Gửi tin nhắn mới vào cuộc trò chuyện.
        [HttpPost]
        public async Task<IActionResult> SendMessage(int conversationId, [FromBody] SendMessageRequestDTO request)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.ConversationId == conversationId);
            if (conversation == null)
                return NotFound("Cuộc trò chuyện không tồn tại.");

            if (conversation.User1Id != request.SenderId && conversation.User2Id != request.SenderId)
                return Unauthorized("Người dùng không thuộc cuộc trò chuyện.");

            var message = new Message
            {
                ConversationId = conversationId,
                SenderId = request.SenderId,
                Content = request.Content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(message);
            conversation.LastMessageAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var receiverId = (conversation.User1Id == request.SenderId) ? conversation.User2Id : conversation.User1Id;

            await _chatHubContext.Clients.User(receiverId.ToString())
                .SendAsync("ReceiveMessage", conversationId, request.SenderId, request.Content, message.SentAt);

            var responseDto = new MessageResponseDTO
            {
                MessageId = message.MessageId,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId.GetValueOrDefault(),
                Content = message.Content,
                SentAt = message.SentAt.GetValueOrDefault(),
                IsRead = message.IsRead.GetValueOrDefault()
            };

            return Ok(responseDto);
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

            if (message.SenderId != request.SenderId)
                return Unauthorized("Bạn không có quyền cập nhật tin nhắn này.");

            message.Content = request.Content;
            await _context.SaveChangesAsync();

            var responseDto = new MessageResponseDTO
            {
                MessageId = message.MessageId,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId.GetValueOrDefault(),
                Content = message.Content,
                SentAt = message.SentAt.GetValueOrDefault(),
                IsRead = message.IsRead.GetValueOrDefault()
            };

            return Ok(responseDto);
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


