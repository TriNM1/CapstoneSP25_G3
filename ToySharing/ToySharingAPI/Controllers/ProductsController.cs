using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    }
}
