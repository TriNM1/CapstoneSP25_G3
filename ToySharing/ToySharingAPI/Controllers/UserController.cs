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

        // Get user by ID (không hiển thị Latitude, Longitude)
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
                    CreatedAt = u.CreatedAt
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

        // View Other User's Profile (không hiển thị Latitude, Longitude)
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

        // Edit account (Update user) - Lưu Latitude/Longitude từ Address
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
            existingUser.Gender = userDto.Gender;
            existingUser.Age = userDto.Age;

            // Nếu có address, tự động cập nhật Latitude và Longitude
            if (!string.IsNullOrEmpty(userDto.Address))
            {
                var coordinates = await GetCoordinatesFromAddressAsync(userDto.Address);
                if (coordinates != null)
                {
                    existingUser.Latitude = coordinates.Value.Latitude;
                    existingUser.Longtitude = coordinates.Value.Longitude;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully" });
        }

        // Get User Location (chỉ trả về Address)
        [HttpGet("{id}/location")]
        public async Task<IActionResult> GetUserLocation(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    Address = u.Address
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(user);
        }

        // Update User Location - Lưu Latitude/Longitude từ Address
        [HttpPut("{id}/location")]
        public async Task<IActionResult> UpdateUserLocation(int id, [FromBody] LocationUpdateDTO locationDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (!string.IsNullOrEmpty(locationDto.Address))
            {
                var coordinates = await GetCoordinatesFromAddressAsync(locationDto.Address);
                if (coordinates != null)
                {
                    user.Latitude = coordinates.Value.Latitude;
                    user.Longtitude = coordinates.Value.Longitude;
                    user.Address = locationDto.Address;
                }
                else
                {
                    return BadRequest("Could not retrieve coordinates from the provided address.");
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User location updated successfully" });
        }

        // Hàm hỗ trợ lấy tọa độ từ địa chỉ bằng Nominatim (đã sửa)
        private async Task<(decimal Latitude, decimal Longitude)?> GetCoordinatesFromAddressAsync(string address)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var encodedAddress = Uri.EscapeDataString(address);
                var url = $"https://nominatim.openstreetmap.org/search?q={encodedAddress}&format=jsonv2";
                client.DefaultRequestHeaders.Add("User-Agent", "ToySharingAPI");
                var response = await client.GetStringAsync(url);
                var json = JsonSerializer.Deserialize<JsonElement>(response);

                // Kiểm tra nếu JSON là mảng và có ít nhất 1 phần tử
                if (json.ValueKind == JsonValueKind.Array && json.GetArrayLength() > 0)
                {
                    var firstResult = json[0]; // Lấy phần tử đầu tiên trong mảng
                    if (firstResult.TryGetProperty("lat", out var latProp) && firstResult.TryGetProperty("lon", out var lonProp))
                    {
                        // Chuyển đổi chuỗi lat/lon thành decimal
                        decimal latitude = decimal.Parse(latProp.GetString());
                        decimal longitude = decimal.Parse(lonProp.GetString());
                        return (latitude, longitude);
                    }
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetCoordinatesFromAddressAsync: {ex.Message}");
                return null;
            }
        }

        // Calculate Distance to Product Owner (dùng Haversine thay vì Google Maps)
        [HttpGet("distance-to-product/{productId}")]
        public async Task<IActionResult> CalculateDistanceToProduct(int productId, decimal myLatitude, decimal myLongitude)
        {
            var product = await _context.Products
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            var owner = product.User;
            if (owner == null || !owner.Latitude.HasValue || !owner.Longtitude.HasValue)
            {
                return BadRequest("Owner location is not available.");
            }

            var ownerLatitude = owner.Latitude.Value;
            var ownerLongitude = owner.Longtitude.Value;

            // Tính khoảng cách bằng công thức Haversine
            double distance = CalculateHaversineDistance(myLatitude, myLongitude, ownerLatitude, ownerLongitude);

            return Ok(new
            {
                DistanceKilometers = distance,
                DistanceText = $"{distance:F2} km"
            });
        }

        // Công thức Haversine tính khoảng cách (km)
        private double CalculateHaversineDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double R = 6371; // Bán kính Trái Đất (km)
            double dLat = ToRadians((double)(lat2 - lat1));
            double dLon = ToRadians((double)(lon2 - lon1));
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }
    }
}