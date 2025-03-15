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

            if (product == null)
            {
                return NotFound("Product not found.");
            }

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
            if (string.IsNullOrEmpty(productDto.Name) || productDto.Price < 0)
            {
                return BadRequest("Product name is required and price cannot be negative.");
            }

            var product = new Product
            {
                UserId = userId,
                Name = productDto.Name,
                Available = productDto.Available, // Không cần ?? vì Available trong DTO là int
                Description = productDto.Description,
                ProductStatus = productDto.ProductStatus,
                Price = productDto.Price,
                SuitableAge = productDto.SuitableAge,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (!string.IsNullOrEmpty(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName);
                if (category != null)
                {
                    product.CategoryId = category.CategoryId;
                }
                else
                {
                    category = new Category
                    {
                        CategoryName = productDto.CategoryName
                    };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                    product.CategoryId = category.CategoryId;
                }
            }

            if (productDto.ImagePaths.Any())
            {
                product.Images = productDto.ImagePaths.Select(path => new Image
                {
                    Path = path,
                    CreateTime = DateTime.UtcNow
                }).ToList();
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            productDto.ProductId = product.ProductId;
            productDto.UserId = product.UserId;
            productDto.CreatedAt = product.CreatedAt ?? DateTime.UtcNow;
            return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, productDto);
        }

        // Manage product
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(int id, int userId, ProductDTO productDto)
        {
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
            if (string.IsNullOrEmpty(productDto.Name) || productDto.Price < 0)
            {
                return BadRequest("Product name is required and price cannot be negative.");
            }

            if (productDto.Available != product.Available)
            {
                var activeRequest = await _context.RentRequests
                    .FirstOrDefaultAsync(r => r.ProductId == id && r.Status == 1);
                if (activeRequest != null && productDto.Available != 1)
                {
                    return BadRequest("Cannot change availability while product is being rented.");
                }
            }

            product.Name = productDto.Name;
            if (!string.IsNullOrEmpty(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName);
                if (category != null)
                {
                    product.CategoryId = category.CategoryId;
                }
                else
                {
                    category = new Category
                    {
                        CategoryName = productDto.CategoryName
                    };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                    product.CategoryId = category.CategoryId;
                }
            }
            product.Available = productDto.Available;
            product.Description = productDto.Description;
            product.ProductStatus = productDto.ProductStatus;
            product.Price = productDto.Price;
            product.SuitableAge = productDto.SuitableAge;
            product.UpdatedAt = DateTime.UtcNow;

            if (productDto.ImagePaths != null)
            {
                product.Images.Clear();
                product.Images = productDto.ImagePaths.Select(path => new Image
                {
                    Path = path,
                    CreateTime = DateTime.UtcNow
                }).ToList();
            }

            await _context.SaveChangesAsync();
            return Ok(productDto);
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