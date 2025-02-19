using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ToysharingVer1Context _context;
        public UserController(ToysharingVer1Context context)
        {
            _context = context;
        }
        //Manage account
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetUserById(int id)
        {
            var user = await _context.Users
                .Where(u => u.UserId == id)
                .Select(u => new DTO.UserDTO
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Rating = u.Rating
                })
                .FirstOrDefaultAsync();
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }
        //Edit account
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserDTO userDto)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }
            existingUser.Name = userDto.Name;
            existingUser.Email = userDto.Email;
            existingUser.Phone = userDto.Phone;
            existingUser.Address = userDto.Address;
            existingUser.Status = userDto.Status;
            existingUser.Avatar = userDto.Avatar;

            await _context.SaveChangesAsync();
            return Ok(); 
        }
        // Edit account
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserDetails(int id, UserDTO userDto)
        {
            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }

            existingUser.Name = userDto.Name;
            existingUser.Email = userDto.Email;
            existingUser.Phone = userDto.Phone;
            existingUser.Address = userDto.Address;
            existingUser.Status = userDto.Status;
            existingUser.Avatar = userDto.Avatar;

            await _context.SaveChangesAsync();
            return Ok();
        }

        // Create new user
        [HttpPost]
        public async Task<ActionResult<UserDTO>> CreateUser(UserDTO userDto)
        {
            var newUser = new User
            {
                Name = userDto.Name,
                Email = userDto.Email,
                Phone = userDto.Phone,
                Address = userDto.Address,
                Status = userDto.Status,
                Avatar = userDto.Avatar,
                Rating = null 
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            userDto.UserId = newUser.UserId; 
            return CreatedAtAction(nameof(GetUserById), new { id = newUser.UserId }, userDto);
        }
    }
}
