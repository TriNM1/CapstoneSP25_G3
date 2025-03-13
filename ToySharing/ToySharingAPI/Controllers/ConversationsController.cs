using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO.ChatDTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;

        public ConversationsController(ToySharingVer3Context context)
        {
            _context = context;
        }

        // GET: api/conversations
        // Lấy danh sách cuộc trò chuyện của người dùng hiện tại
        // kèm theo thông tin tóm tắt (người đối diện, tin nhắn cuối, thời gian).
        [HttpGet]
        public async Task<IActionResult> GetConversations()
        {
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong DB chính.");

            int mainUserId = mainUser.Id;

            var conversations = await _context.Conversations
                .Where(c => c.User1Id == mainUserId || c.User2Id == mainUserId)
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();

            return Ok(conversations);
        }

        // GET: api/conversations/{id}
        // Lấy thông tin chi tiết của một cuộc trò chuyện (danh sách tin nhắn, thông tin người tham gia)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetConversation(int id)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.ConversationId == id);

            if (conversation == null)
                return NotFound();

            var conversationDTO = new ConversationDetailsDTO
            {
                ConversationId = conversation.ConversationId,
                CreatedAt = conversation.CreatedAt.GetValueOrDefault(),
                LastMessageAt = conversation.LastMessageAt.GetValueOrDefault(),
                User1Id = conversation.User1Id,
                User2Id = conversation.User2Id,
                Messages = conversation.Messages.Select(m => new MessageDTO
                {
                    MessageId = m.MessageId,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId.GetValueOrDefault(),
                    Content = m.Content,
                    SentAt = m.SentAt.GetValueOrDefault(),
                    IsRead = m.IsRead.GetValueOrDefault()
                }).ToList()
            };

            return Ok(conversationDTO);
        }

        // POST: api/conversations
        // Tạo mới một cuộc trò chuyện giữa 2 user nếu chưa tồn tại.
        [HttpPost]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequestDTO request)
        {
            if (request.User1Id == request.User2Id)
                return BadRequest("Không thể tạo cuộc trò chuyện với chính mình.");

            var existingConversation = await _context.Conversations.FirstOrDefaultAsync(c =>
                (c.User1Id == request.User1Id && c.User2Id == request.User2Id) ||
                (c.User1Id == request.User2Id && c.User2Id == request.User1Id)
            );
            if (existingConversation != null)
                return Ok(existingConversation);

            var conversation = new Conversation
            {
                User1Id = request.User1Id,
                User2Id = request.User2Id,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetConversation), new { id = conversation.ConversationId }, conversation);
        }
    }
}

