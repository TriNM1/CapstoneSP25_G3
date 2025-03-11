using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly ToysharingVer2Context _context;

        public RequestsController(ToysharingVer2Context context)
        {
            _context = context;
        }

        // Create a request
        [HttpPost]
        public async Task<ActionResult<RequestDTO>> CreateRequest(RequestDTO requestDto)
        {
            var product = await _context.Products.FindAsync(requestDto.ProductId);
            if (product == null || product.Available != 2) // Chỉ cho phép tạo request nếu sản phẩm sẵn sàng
            {
                return BadRequest("Product is not available for rent.");
            }

            var request = new RentRequest
            {
                UserId = requestDto.UserId,
                ProductId = requestDto.ProductId,
                Status = 0, // Chờ duyệt
                RequestDate = requestDto.RequestDate ?? DateTime.UtcNow,
                RentdateDate = requestDto.RentdateDate,
                ReturnDate = requestDto.ReturnDate
            };

            _context.RentRequests.Add(request);
            await _context.SaveChangesAsync();

            requestDto.RequestId = request.RequestId;
            return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestId }, requestDto);
        }

        // Update request status (duyệt hoặc hoàn thành)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(int id, int newStatus)
        {
            var request = await _context.RentRequests
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.RequestId == id);

            if (request == null)
            {
                return NotFound("Request not found.");
            }

            var product = request.Product;
            if (product == null)
            {
                return NotFound("Associated product not found.");
            }

            // Đồng bộ Status và Available
            switch (newStatus)
            {
                case 1: // Đã duyệt
                    if (request.Status != 0) // Chỉ cho phép từ "chờ duyệt" sang "đã duyệt"
                    {
                        return BadRequest("Request can only be approved from 'pending' status.");
                    }
                    request.Status = 1;
                    product.Available = 1; // Đang mượn
                    break;

                case 2: // Hoàn thành
                    if (request.Status != 1) // Chỉ cho phép từ "đã duyệt" sang "hoàn thành"
                    {
                        return BadRequest("Request can only be completed from 'approved' status.");
                    }
                    request.Status = 2;
                    product.Available = 2; // Sẵn sàng
                    break;

                default:
                    return BadRequest("Invalid status value. Use 1 for approved, 2 for completed.");
            }

            await _context.SaveChangesAsync();
            return Ok(new RequestDTO
            {
                RequestId = request.RequestId,
                UserId = request.UserId,
                ProductId = request.ProductId,
                Status = request.Status,
                RequestDate = request.RequestDate,
                RentdateDate = request.RentdateDate,
                ReturnDate = request.ReturnDate
            });
        }

        // View list request (danh sách request cho sản phẩm của userId - chủ sở hữu)
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetRequestsByUserId(int userId)
        {
            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .Where(r => r.Product.UserId == userId) // Lấy request dựa trên chủ sở hữu sản phẩm
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId, // UserId của người mượn
                    ProductId = r.ProductId,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentdateDate = r.RentdateDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // View history list request (status = complete)
        [HttpGet("history/{userId}")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetRequestHistory(int userId)
        {
            var requests = await _context.RentRequests
                .Where(r => r.UserId == userId && r.Status == 2) // 2: hoàn thành
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentdateDate = r.RentdateDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Toy Request List
        [HttpGet("toy-request/{productId}/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetToyRequestList(int productId, int userId)
        {
            var requests = await _context.RentRequests
                .Where(r => r.ProductId == productId && r.UserId == userId)
                .Include(r => r.User)
                .Include(r => r.Product)
                .Select(r => new
                {
                    BorrowerName = r.User.Name,
                    BorrowDate = r.RentdateDate,
                    Avatar = r.User.Avatar,
                    Message = r.Product.Description
                })
                .ToListAsync();

            if (!requests.Any())
            {
                return NotFound("No requests found.");
            }

            return Ok(requests);
        }

        // My toy borrower list
        [HttpGet("my-toys/borrowers/{userId}")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetMyToyBorrowers(int userId)
        {
            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .Where(r => r.Product.UserId == userId && r.Status == 0) // 0: chờ duyệt
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentdateDate = r.RentdateDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Borrow history
        [HttpGet("borrow-history/{userId}")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetBorrowHistory(int userId)
        {
            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .Where(r => r.Product.UserId == userId)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentdateDate = r.RentdateDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Helper method to get request by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<RequestDTO>> GetRequestById(int id)
        {
            var request = await _context.RentRequests
                .Where(r => r.RequestId == id)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentdateDate = r.RentdateDate,
                    ReturnDate = r.ReturnDate
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound();
            }

            return Ok(request);
        }
    }
}