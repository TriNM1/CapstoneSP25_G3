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
                    //,
                    //ImagePath = p.Images.FirstOrDefault().Path
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
                    //,
                    //ImagePath = p.Images.FirstOrDefault().Path
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
        // Create a product
        [HttpPost]
        public async Task<ActionResult<ProductDTO>> CreateProduct(int userId, ProductDTO productDto)
        {
            var product = new Product
            {
                UserId = userId,
                Name = productDto.Name,
                Tag = productDto.Tag,
                Available = 2,
                Description = productDto.Description,
                ProductStatus = productDto.ProductStatus,
                Address = productDto.Address,
                CreatedAt = DateTime.UtcNow 
            };
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            //if (!string.IsNullOrEmpty(productDto.ImagePath))
            //{
            //    var image = new Image
            //    {
            //        ProductId = product.ProductId,
            //        Path = productDto.ImagePath,
            //        CreateTime = DateTime.UtcNow
            //    };
            //_context.Images.Add(image);
            //    await _context.SaveChangesAsync();
            //}
            productDto.ProductId = product.ProductId;
            return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, productDto);
        }

        // Update product
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(int id, int userId, ProductDTO productDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.UserId != userId)
            {
                return NotFound();
            }

            product.Name = productDto.Name;
            product.Tag = productDto.Tag;
            product.Available = productDto.Available;
            product.Description = productDto.Description;
            product.ProductStatus = productDto.ProductStatus;
            product.Address = productDto.Address;

            await _context.SaveChangesAsync();
            //if (!string.IsNullOrEmpty(productDto.ImagePath))
            //{
            //    var image = product.Images.FirstOrDefault();
            //    if (image != null)
            //    {
            //        image.Path = productDto.ImagePath;
            //    }
            //    else
            //    {
            //        product.Images.Add(new Image { Path = productDto.ImagePath, CreateTime = DateTime.UtcNow });
            //    }
            //}
            return Ok(productDto);
        }

        // My toy list
        [HttpGet("my-toys/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyToys(int userId)
        {
            var products = await _context.Products
                .Where(p => p.UserId == userId)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    Tag = p.Tag,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt
                    //,
                    //ImagePath = p.Images.FirstOrDefault().Path
                })
                .ToListAsync();

            return Ok(products);
        }

        // My toy list borrowing
        [HttpGet("my-toys/borrowing/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyBorrowingToys(int userId)
        {
            var products = await _context.Products
                .Where(p => p.UserId == userId && p.Available == 1)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    Tag = p.Tag,
                    Available = p.Available,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Address = p.Address,
                    CreatedAt = p.CreatedAt
                    //,
                    //ImagePath = p.Images.FirstOrDefault().Path
                })
                .ToListAsync();

            return Ok(products);
        }
    }
}
