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
        private readonly ToysharingVer2Context _context;
        public ProductsController(ToysharingVer2Context context)
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
    }
}
