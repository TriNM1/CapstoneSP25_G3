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
            // Lấy Claim NameIdentifier từ JWT token
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            // Tìm user trong DB chính theo trường auth_user_id
            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            int mainUserId = mainUser.Id;

            // Lấy danh sách cuộc trò chuyện của user, bao gồm tin nhắn để có thể lấy tin nhắn cuối cùng
            var conversations = await _context.Conversations
                .Include(c => c.Messages)
                .Where(c => c.User1Id == mainUserId || c.User2Id == mainUserId)
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();

            var conversationSummaries = new List<ConversationSummaryDTO>();

            foreach (var conv in conversations)
            {
                // Xác định đối tượng đối diện: nếu mainUser là User1 thì opponent là User2, ngược lại.
                int opponentId = conv.User1Id == mainUserId ? conv.User2Id : conv.User1Id;
                var opponent = await _context.Users.FirstOrDefaultAsync(u => u.Id == opponentId);
                if (opponent == null)
                    continue;

                // Lấy tin nhắn cuối cùng nếu có trong cuộc trò chuyện
                var lastMessage = conv.Messages?
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefault();

                conversationSummaries.Add(new ConversationSummaryDTO
                {
                    ConversationId = conv.ConversationId,
                    OtherUser = new OtherUserDTO
                    {
                        Id = opponent.Id,
                        Name = opponent.Name,
                        Avatar = opponent.Avatar
                    },
                    LastMessageContent = lastMessage != null ? lastMessage.Content : string.Empty,
                    LastMessageAt = lastMessage != null
                                    ? lastMessage.SentAt.GetValueOrDefault()
                                    : conv.LastMessageAt.GetValueOrDefault(),
                    IsRead = lastMessage != null ? lastMessage.IsRead.GetValueOrDefault() : true,
                    LastSenderId = lastMessage != null ? lastMessage.SenderId.GetValueOrDefault() : 0
                });
            }

            return Ok(conversationSummaries);
        }

        // GET: api/conversations/{id}
        // Lấy thông tin chi tiết của một cuộc trò chuyện (danh sách tin nhắn, thông tin người tham gia)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetConversation(int id)
        {
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            var conversation = await _context.Conversations
                        .Include(c => c.Messages)
                        .FirstOrDefaultAsync(c => c.ConversationId == id);

            if (conversation == null)
                return NotFound();

            // Kiểm tra xem user hiện tại có tham gia cuộc trò chuyện này hay không
            if (conversation.User1Id != mainUser.Id && conversation.User2Id != mainUser.Id)
            {
                return Unauthorized("Bạn không có quyền truy cập cuộc trò chuyện này.");
            }

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
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            int User1Id = mainUser.Id;
            if (User1Id == request.User2Id)
                return BadRequest("Không thể tạo cuộc trò chuyện với chính mình.");

            var existingConversation = await _context.Conversations.FirstOrDefaultAsync(c =>
                (c.User1Id == User1Id && c.User2Id == request.User2Id) ||
                (c.User1Id == request.User2Id && c.User2Id == User1Id)
            );
            if (existingConversation != null)
            {
                var existingDTO = new ConversationDTO
                {
                    ConversationId = existingConversation.ConversationId,
                    User1Id = existingConversation.User1Id,
                    User2Id = existingConversation.User2Id,
                    CreatedAt = existingConversation.CreatedAt.GetValueOrDefault(),
                    LastMessageAt = existingConversation.LastMessageAt.GetValueOrDefault()
                };
                return Ok(existingDTO);
            }

            var conversation = new Conversation
            {
                User1Id = User1Id,
                User2Id = request.User2Id,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            var conversationDTO = new ConversationDTO
            {
                ConversationId = conversation.ConversationId,
                User1Id = conversation.User1Id,
                User2Id = conversation.User2Id,
                CreatedAt = conversation.CreatedAt.GetValueOrDefault(),
                LastMessageAt = conversation.LastMessageAt.GetValueOrDefault()
            };

            return CreatedAtAction(nameof(GetConversation), new { id = conversation.ConversationId }, conversationDTO);
        }
    }
}

