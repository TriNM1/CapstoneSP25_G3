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
        private readonly IHttpClientFactory _httpClientFactory;

        public UserController(ToySharingVer3Context context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
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
                    Rating = _context.Histories
                        .Where(h => h.Product.UserId == u.Id && h.Status == 2)
                        .Average(h => (double?)h.Rating) ?? 0,
                    CreatedAt = u.CreatedAt,
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude
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
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
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
                            .Average(h => (double?)h.Rating) ?? 0
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

        // Get User Location
        [HttpGet("{id}/location")]
        public async Task<IActionResult> GetUserLocation(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude,
                    Address = u.Address
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(user);
        }

        // Update User Location
        [HttpPut("{id}/location")]
        public async Task<IActionResult> UpdateUserLocation(int id, [FromBody] LocationUpdateDTO locationDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.Latitude = locationDto.Latitude;
            user.Longtitude = locationDto.Longitude;
            user.Address = locationDto.Address;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User location updated successfully" });
        }

        // Get Address from Coordinates (dùng Nominatim)
        [HttpGet("location/address")]
        public async Task<IActionResult> GetAddressFromCoordinates(decimal latitude, decimal longitude)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var url = $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latitude}&lon={longitude}";
                client.DefaultRequestHeaders.Add("User-Agent", "ToySharingAPI"); // Nominatim yêu cầu User-Agent
                var response = await client.GetStringAsync(url);
                var json = JsonSerializer.Deserialize<JsonElement>(response);
                string address = json.GetProperty("display_name").GetString() ?? "Unknown address";

                return Ok(new { Address = address });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving address: {ex.Message}");
            }
        }

        // Get Coordinates from Address (dùng Nominatim)
        [HttpGet("location/coordinates")]
        public async Task<IActionResult> GetCoordinatesFromAddress(string address)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var encodedAddress = Uri.EscapeDataString(address);
                var url = $"https://nominatim.openstreetmap.org/search?q={encodedAddress}&format=jsonv2";
                client.DefaultRequestHeaders.Add("User-Agent", "ToySharingAPI"); 
                var response = await client.GetStringAsync(url);
                var json = JsonSerializer.Deserialize<JsonElement>(response);
                if (json.TryGetProperty("0", out var firstResult))
                {
                    decimal latitude = firstResult.GetProperty("lat").GetDecimal();
                    decimal longitude = firstResult.GetProperty("lon").GetDecimal();
                    return Ok(new { Latitude = latitude, Longitude = longitude });
                }
                return NotFound("No coordinates found for this address.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving coordinates: {ex.Message}");
            }
        }
    }

    public class LocationUpdateDTO
    {
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Address { get; set; }
    }
}