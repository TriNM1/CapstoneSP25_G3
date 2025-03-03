using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.Xml;
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

        // Manage account (Get user by ID)
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetUserById(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Rating = u.Rating,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude,
                    Gender = u.Gender,
                    Age = u.Age
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        // View Other User's Profile
        [HttpGet("profile/{userId}")]
        public async Task<ActionResult<UserDTO>> GetOtherUserProfile(int userId)
        {
            var userProfile = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new UserProfileDTO
                {
                    UserInfo = new UserInfo
                    {
                        Name = u.Name,
                        Age = u.Age ?? 0,
                        Address = u.Address,
                        Avatar = u.Avatar
                    },
                    ToyListOfUser = _context.Products
                        .Where(p => p.UserId == userId)
                        .Select(p => new ProductDTO
                        {
                            ProductId = p.ProductId,
                            UserId = p.UserId,
                            Name = p.Name,
                            CategoryName = p.Category != null ? p.Category.CategoryName : null,
                            Available = p.Available,
                            Description = p.Description,
                            ProductStatus = p.ProductStatus,
                            Address = p.Address,
                            CreatedAt = p.CreatedAt,
                            Price = p.Price,
                            SuitableAge = p.SuitableAge,
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (userProfile == null)
            {
                return NotFound();
            }

            var currentUser = await _context.Users
                .Where(u => u.Id == userId) 
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Role = u.Role ?? 0,
                    CreatedAt = u.CreatedAt,
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude,
                    Gender = u.Gender,
                    Age = u.Age,
                    Rating = u.Rating,
                    UserProfile = userProfile 
                })
                .FirstOrDefaultAsync();

            if (currentUser == null)
            {
                return NotFound();
            }

            return Ok(currentUser);
        }

        // Edit account (Update user)
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
            existingUser.Role = userDto.Role;
            existingUser.Latitude = userDto.Latitude;
            existingUser.Longtitude = userDto.Longitude;
            existingUser.Gender = userDto.Gender;
            existingUser.Age = userDto.Age;
            existingUser.Rating = userDto.Rating;

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
                Rating = userDto.Rating ?? 0,
                Role = userDto.Role,
                CreatedAt = DateTime.UtcNow,
                Latitude = userDto.Latitude,
                Longtitude = userDto.Longitude,
                Gender = userDto.Gender,
                Age = userDto.Age
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            userDto.Id = newUser.Id;
            return CreatedAtAction(nameof(GetUserById), new { id = newUser.Id }, userDto);
        }
    }
}