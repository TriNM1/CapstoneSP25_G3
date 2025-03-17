using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;

        public ProductsController(ToySharingVer3Context context)
        {
            _context = context;
        }

        [HttpPut("{id}/visibility-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleProductVisibility(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Toggle available status
            product.Available = (product.Available == 0) ? 2 : 0;
            _context.Entry(product).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product visibility updated.", product });
        }

        // View all products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetAllProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0, // Mặc định 0 nếu null
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow, // Mặc định UTCNow nếu null
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();
            return Ok(products);
        }

        // View product information
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDTO>> GetProductById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.ProductId == id)
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
                .FirstOrDefaultAsync();
            return Ok(product);
        }


        // View product detail
        [HttpGet("detail/{productId}")]
        public async Task<ActionResult<object>> GetProductDetail(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.ProductId == productId)
                .Select(p => new
                {
                    ProductId = p.ProductId,
                    ProductName = p.Name,
                    Cost = p.Price,
                    Description = p.Description,
                    ImagePaths = p.Images.Select(i => i.Path).ToList(),
                    RentInfo = _context.RentRequests
                        .Where(r => r.ProductId == p.ProductId && r.Status == 1)
                        .Select(r => new { BorrowDate = r.RentDate, ReturnDate = r.ReturnDate })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            return Ok(product);
        }

        // View user information (owner) với Rating
        [HttpGet("{id}/owner")]
        public async Task<ActionResult<UserDTO>> GetOwnerProfileByProductId(int id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            var owner = await _context.Users
                .Where(u => u.Id == product.UserId)
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

            if (owner == null)
            {
                return NotFound("Owner not found.");
            }

            return Ok(owner);
        }

        // Input product (Thêm sản phẩm với ảnh)
        [HttpPost]
        public async Task<ActionResult<ProductDTO>> CreateProduct(int userId, [FromBody] ProductDTO productDto)
        {
            if (productDto == null)
            {
                return BadRequest("Product data is required.");
            }

            if (string.IsNullOrWhiteSpace(productDto.Name))
            {
                return BadRequest("Product name is required and cannot be empty or whitespace.");
            }
            if (productDto.SuitableAge < 0 || productDto.SuitableAge > 100)
            {
                return BadRequest("Suitable age must be between 0 and 100.");
            }

            if (!string.IsNullOrEmpty(productDto.Description) && productDto.Description.Length > 500)
            {
                return BadRequest("Description cannot exceed 500 characters.");
            }

            var product = new Product
            {
                UserId = userId,
                Name = productDto.Name.Trim(),
                Available = productDto.Available,
                Description = productDto.Description?.Trim(),
                ProductStatus = productDto.ProductStatus,
                Price = productDto.Price,
                SuitableAge = productDto.SuitableAge,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Xử lý Category
            if (!string.IsNullOrWhiteSpace(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName.Trim());
                if (category == null)
                {
                    category = new Category
                    {
                        CategoryName = productDto.CategoryName.Trim()
                    };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
                product.CategoryId = category.CategoryId;
            }

            // Xử lý ImagePaths
            if (productDto.ImagePaths != null && productDto.ImagePaths.Any())
            {
                if (productDto.ImagePaths.Count > 10) // Giới hạn số lượng ảnh
                {
                    return BadRequest("Maximum 10 images are allowed.");
                }
                foreach (var path in productDto.ImagePaths)
                {
                    if (string.IsNullOrWhiteSpace(path))
                    {
                        return BadRequest("Image path cannot be empty.");
                    }
                    if (path.Length > 255) // Giới hạn độ dài đường dẫn
                    {
                        return BadRequest("Image path cannot exceed 255 characters.");
                    }
                }
                product.Images = productDto.ImagePaths.Select(path => new Image
                {
                    Path = path.Trim(),
                    CreateTime = DateTime.UtcNow
                }).ToList();
            }

            try
            {
                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                productDto.ProductId = product.ProductId;
                productDto.UserId = product.UserId;
                productDto.CreatedAt = DateTime.Now;
                return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, productDto);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Database error occurred: {ex.InnerException?.Message}");
            }
        }

        // Manage product
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(int id, int userId, [FromBody] ProductDTO productDto)
        {
            if (productDto == null)
            {
                return BadRequest("Product data is required.");
            }

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == id);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            if (product.UserId != userId)
            {
                return Forbid("You are not authorized to update this product.");
            }

            // Kiểm tra các trường bắt buộc
            if (string.IsNullOrWhiteSpace(productDto.Name))
            {
                return BadRequest("Product name is required and cannot be empty or whitespace.");
            }
            if (productDto.SuitableAge < 0 || productDto.SuitableAge > 100)
            {
                return BadRequest("Suitable age must be between 0 and 100.");
            }

            // Kiểm tra độ dài chuỗi
            if (!string.IsNullOrEmpty(productDto.Description) && productDto.Description.Length > 500)
            {
                return BadRequest("Description cannot exceed 500 characters.");
            }

            // Kiểm tra trạng thái Available
            if (productDto.Available != product.Available)
            {
                var activeRequest = await _context.RentRequests
                    .FirstOrDefaultAsync(r => r.ProductId == id && r.Status == 1);
                if (activeRequest != null && productDto.Available != 1)
                {
                    return BadRequest("Cannot change availability while product is being rented.");
                }
            }

            // Cập nhật thông tin sản phẩm
            product.Name = productDto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName.Trim());
                if (category == null)
                {
                    category = new Category
                    {
                        CategoryName = productDto.CategoryName.Trim()
                    };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
                product.CategoryId = category.CategoryId;
            }
            product.Available = productDto.Available;
            product.Description = productDto.Description?.Trim();
            product.ProductStatus = productDto.ProductStatus;
            product.Price = productDto.Price;
            product.SuitableAge = productDto.SuitableAge;
            product.UpdatedAt = DateTime.UtcNow;

            // Xử lý ImagePaths
            if (productDto.ImagePaths != null)
            {
                if (productDto.ImagePaths.Count > 10) // Giới hạn số lượng ảnh
                {
                    return BadRequest("Maximum 10 images are allowed.");
                }
                foreach (var path in productDto.ImagePaths)
                {
                    if (string.IsNullOrWhiteSpace(path))
                    {
                        return BadRequest("Image path cannot be empty.");
                    }
                    if (path.Length > 255)
                    {
                        return BadRequest("Image path cannot exceed 255 characters.");
                    }
                }
                product.Images.Clear();
                product.Images = productDto.ImagePaths.Select(path => new Image
                {
                    Path = path.Trim(),
                    CreateTime = DateTime.UtcNow
                }).ToList();
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(productDto);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Database error occurred: {ex.InnerException?.Message}");
            }
        }

        // View user's toys
        [HttpGet("my-toys/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyToys(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId == userId)
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

        // View user's borrowing toys
        [HttpGet("my-toys/borrowing/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyBorrowingToys(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId == userId && (p.Available ?? 0) == 1)
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

        // View all borrowed toys by other users
        [HttpGet("borrowed/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetBorrowedToys(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId != userId && (p.Available ?? 0) == 1)
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

        // Search product (giữ nguyên tạm thời)
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> SearchProducts()
        {
            return await GetAllProducts();
        }

        // List Toy Recommendations
        [HttpGet("recommendations/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> ListToyRecommendations(int userId)
        {
            var recommendations = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => (p.Available ?? 0) == 0 && p.UserId != userId)
                .OrderBy(p => Guid.NewGuid())
                .Take(5)
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

            return Ok(recommendations);
        }
    }
}