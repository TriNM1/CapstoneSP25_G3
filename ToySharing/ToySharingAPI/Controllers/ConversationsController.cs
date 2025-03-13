using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO.ChatDTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            // Lấy userId từ claim, đảm bảo người dùng đã xác thực
            var userIdStr = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr))
                return Unauthorized();
            
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var conversations = await _context.Conversations
                .Where(c => c.User1Id == userId || c.User2Id == userId)
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
                .Include(c => c.Messages)  // Tùy chọn: include danh sách tin nhắn
                .FirstOrDefaultAsync(c => c.ConversationId == id);

            if (conversation == null)
                return NotFound();

            return Ok(conversation);
        }

        // POST: api/conversations
        // Tạo mới một cuộc trò chuyện giữa 2 user nếu chưa tồn tại.
        [HttpPost]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequestDTO request)
        {
            // Kiểm tra không cho tạo cuộc trò chuyện với chính mình
            if (request.User1Id == request.User2Id)
                return BadRequest("Không thể tạo cuộc trò chuyện với chính mình.");

            // Kiểm tra xem cuộc trò chuyện giữa 2 user đã tồn tại chưa
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

