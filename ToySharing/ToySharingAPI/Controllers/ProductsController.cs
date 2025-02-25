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
        private readonly ToysharingVer2Context _context;

        public ProductsController(ToysharingVer2Context context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetAllProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge
                })
                .ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDTO>> GetProductById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.ProductId == id)
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
                    SuitableAge = p.SuitableAge
                })
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [HttpGet("{id}/owner")]
        public async Task<ActionResult<UserDTO>> GetOwnerProfileByProductId(int id)
        {
            var userId = await _context.Products
                .Where(p => p.ProductId == id)
                .Select(p => p.UserId)
                .FirstOrDefaultAsync();

            if (userId == null)
            {
                return NotFound("Product not found.");
            }

            var owner = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new DTO.UserDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Rating = u.Rating,
                })
                .FirstOrDefaultAsync();

            if (owner == null)
            {
                return NotFound("Owner not found.");
            }

            return Ok(owner);
        }

        [HttpPost]
        public async Task<ActionResult<ProductDTO>> CreateProduct(int userId, ProductDTO productDto)
        {
            var product = new Product
            {
                UserId = userId,
                Name = productDto.Name,
                Available = 2,
                Description = productDto.Description,
                ProductStatus = productDto.ProductStatus,
                Address = productDto.Address,
                CreatedAt = DateTime.UtcNow,
                Price = productDto.Price,
                SuitableAge = productDto.SuitableAge,
                UpdatedAt = DateTime.UtcNow
            };

            if (!string.IsNullOrEmpty(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName);
                if (category != null)
                {
                    product.CategoryId = category.Id;
                }
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            productDto.ProductId = product.ProductId;
            return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, productDto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(int id, int userId, ProductDTO productDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.UserId != userId)
            {
                return NotFound();
            }

            product.Name = productDto.Name;
            if (!string.IsNullOrEmpty(productDto.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == productDto.CategoryName);
                if (category != null)
                {
                    product.CategoryId = category.Id;
                }
            }
            product.Available = productDto.Available;
            product.Description = productDto.Description;
            product.ProductStatus = productDto.ProductStatus;
            product.Address = productDto.Address;
            product.Price = productDto.Price;
            product.SuitableAge = productDto.SuitableAge;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(productDto);
        }

        [HttpGet("my-toys/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyToys(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.UserId == userId)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("my-toys/borrowing/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyBorrowingToys(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.UserId == userId && p.Available == 1)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge
                })
                .ToListAsync();

            return Ok(products);
        }
    }
}