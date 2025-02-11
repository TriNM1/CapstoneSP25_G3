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
        private readonly ToysharingVer1Context _context;
        public ProductsController(ToysharingVer1Context context)
        {
            _context = context;
        }
        //View list toy
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAllProducts()
        {
            var products = await _context.Products
                .Select(p => new DTO.ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    Tag = p.Tag,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();
            return Ok(products);
        }
        //View toy detail
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDTO>> GetProductById(int id)
        {
            var product = await _context.Products
                .Where(p => p.ProductId == id)
                .Select(p => new DTO.ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    Tag = p.Tag,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }
        // View owner profile by Product ID
        [HttpGet("{id}/owner")]
        public async Task<ActionResult<UserDTO>> GetOwnerProfileByProductId(int id)
        {
            var userId = await _context.Products.Select(p => p.UserId).FirstOrDefaultAsync();

            var owner = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new DTO.UserDTO
                {
                    UserId = userId,
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
    }
}
