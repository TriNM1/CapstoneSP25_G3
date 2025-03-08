using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ToysharingVer2Context _context;
        public UserController(ToysharingVer2Context context)
        {
            _context = context;
        }

        [HttpPost("ban")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BanUser([FromBody] BanUnbanRequestDTO request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            user.Status = 1; 
            await _context.SaveChangesAsync();

            var banLog = new BanLog
            {
                UserId = request.UserId,
                Reasons = request.Reason,
                Timestamp = DateTime.Now
            };

            _context.BanLogs.Add(banLog);
            await _context.SaveChangesAsync();

            return Ok("User banned successfully");
        }

        [HttpPost("unban")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnbanUser([FromBody] BanUnbanRequestDTO request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            user.Status = 0;
            await _context.SaveChangesAsync();

            var banLog = new BanLog
            {
                UserId = request.UserId,
                Reasons = request.Reason,
                Timestamp = DateTime.Now
            };

            _context.BanLogs.Add(banLog);
            await _context.SaveChangesAsync();

            return Ok("User unbanned successfully");
        }
        [HttpGet("ban-history")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllBanHistory()
        {
            var logs = await _context.BanLogs
                .Select(log => new BanLogDTO
                {
                    UserId = log.UserId ?? 0,
                    Reasons = log.Reasons,
                    Timestamp = log.Timestamp ?? DateTime.MinValue
                })
                .ToListAsync();

            return Ok(logs);
        }

    }
}
