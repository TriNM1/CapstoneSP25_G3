using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;
using System.Net.Http;
using System.Text.Json;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;

        public UserController(ToySharingVer3Context context)
        {
            _context = context;
        }

        // Get user by ID (không bao gồm danh sách đồ chơi)
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetUserById(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Gender = u.Gender,
                    Age = u.Age,
                    CreatedAt = u.CreatedAt,
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude,
                    Rating = _context.Histories
                        .Where(h => h.Product.UserId == u.Id && h.Status == 2)
                        .Average(h => (float?)h.Rating) ?? 0 // Tính trung bình Rating
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        // API riêng để lấy danh sách đồ chơi của user
        [HttpGet("{id}/products")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetUserProducts(int id)
        {
            var products = await _context.Products
                .Where(p => p.UserId == id)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();

            return Ok(products);
        }

        // View Other User's Profile
        [HttpGet("profile/{userId}")]
        public async Task<ActionResult<UserProfileDTO>> GetOtherUserProfile(int userId)
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
                        Avatar = u.Avatar,
                        Rating = _context.Histories
                            .Where(h => h.Product.UserId == u.Id && h.Status == 2)
                            .Average(h => (float?)h.Rating) ?? 0
                    }
                })
                .FirstOrDefaultAsync();

            if (userProfile == null)
            {
                return NotFound();
            }

            return Ok(userProfile);
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
            existingUser.Address = userDto.Address;
            existingUser.Status = userDto.Status;
            existingUser.Avatar = userDto.Avatar;
            existingUser.Latitude = userDto.Latitude;
            existingUser.Longtitude = userDto.Longitude;
            existingUser.Gender = userDto.Gender;
            existingUser.Age = userDto.Age;
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Get Address from Coordinates
        [HttpGet("location/address")]
        public async Task<IActionResult> GetAddressFromCoordinates(decimal latitude, decimal longitude)
        {
            try
            {
                using var client = new HttpClient();
                var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key=YOUR_API_KEY";
                var response = await client.GetStringAsync(url);
                var json = JsonSerializer.Deserialize<dynamic>(response);
                string address = json["results"][0]["formatted_address"].ToString();

                return Ok(new { Address = address });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving address: {ex.Message}");
            }
        }

        // Get Coordinates from Address
        [HttpGet("location/coordinates")]
        public async Task<IActionResult> GetCoordinatesFromAddress(string address)
        {
            try
            {
                using var client = new HttpClient();
                var encodedAddress = Uri.EscapeDataString(address);
                var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={encodedAddress}&key=YOUR_API_KEY";
                var response = await client.GetStringAsync(url);
                var json = JsonSerializer.Deserialize<dynamic>(response);
                decimal latitude = json["results"][0]["geometry"]["location"]["lat"];
                decimal longitude = json["results"][0]["geometry"]["location"]["lng"];

                return Ok(new { Latitude = latitude, Longitude = longitude });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving coordinates: {ex.Message}");
            }
        }
    }
}