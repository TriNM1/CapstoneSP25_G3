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
        private readonly ToySharingVer3Context _context;

        public RequestsController(ToySharingVer3Context context)
        {
            _context = context;
        }

        // Create a request
        [HttpPost]
        public async Task<ActionResult<RequestDTO>> CreateRequest(RequestDTO requestDto)
        {
            var product = await _context.Products.FindAsync(requestDto.ProductId);
            if (product == null || product.Available != 0)
            {
                return BadRequest("Product is not available for rent.");
            }

            var request = new RentRequest
            {
                UserId = requestDto.UserId,
                ProductId = requestDto.ProductId,
                Message = requestDto.Message,
                Status = 0, // Chờ duyệt
                RequestDate = requestDto.RequestDate ?? DateTime.UtcNow, // Xử lý nullable với mặc định
                RentDate = requestDto.RentDate,
                ReturnDate = requestDto.ReturnDate
            };

            _context.RentRequests.Add(request);
            await _context.SaveChangesAsync();

            requestDto.RequestId = request.RequestId;
            requestDto.RequestDate = request.RequestDate; 
            return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestId }, requestDto);
        }

        // Update request status (chủ sở hữu duyệt/từ chối request)
        [HttpPut("{requestId}/status")]
        public async Task<ActionResult<RequestStatusDTO>> ConfirmOrRejectBorrowingRequest(int requestId, int userId, int newStatus)
        {
            var request = await _context.RentRequests
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
            {
                return NotFound("Request not found.");
            }

            if (request.Product.UserId != userId)
            {
                return Forbid("You are not authorized to manage this request.");
            }

            var product = request.Product;
            if (product == null)
            {
                return NotFound("Associated product not found.");
            }

            switch (newStatus)
            {
                case 1: // Accepted
                    if (request.Status != 0)
                    {
                        return BadRequest("Request can only be approved from 'pending' status.");
                    }
                    request.Status = 1;
                    product.Available = 1;
                    var history = new History
                    {
                        RequestId = request.RequestId,
                        UserId = request.UserId,
                        ProductId = request.ProductId,
                        Status = 0, // Chưa lấy
                        ReturnDate = request.ReturnDate
                    };
                    _context.Histories.Add(history);
                    break;

                case 2: // Rejected
                    if (request.Status != 0)
                    {
                        return BadRequest("Request can only be rejected from 'pending' status.");
                    }
                    request.Status = 2;
                    product.Available = 0;
                    break;

                default:
                    return BadRequest("Invalid status value. Use 1 for accepted, 2 for rejected.");
            }

            await _context.SaveChangesAsync();
            return Ok(new RequestStatusDTO
            {
                RequestId = request.RequestId,
                Status = request.Status
            });
        }

        // View list request (danh sách request cho sản phẩm của userId - chủ sở hữu)
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetRequestsByUserId(int userId)
        {
            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .Where(r => r.Product.UserId == userId)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // View history list request (lịch sử request của người mượn)
        [HttpGet("history/{userId}")]
        public async Task<ActionResult<IEnumerable<HistoryDTO>>> GetRequestHistory(int userId)
        {
            var history = await _context.Histories
                .Where(h => h.UserId == userId)
                .Select(h => new HistoryDTO
                {
                    RequestId = h.RequestId,
                    UserId = h.UserId,
                    ProductId = h.ProductId,
                    Status = h.Status,
                    Rating = h.Rating,
                    ReturnDate = h.ReturnDate
                })
                .ToListAsync();

            return Ok(history);
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
                    BorrowDate = r.RentDate,
                    Avatar = r.User.Avatar,
                    Message = r.Message
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
                .Where(r => r.Product.UserId == userId && r.Status == 0)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    ProductId = r.ProductId,
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Borrow history
        [HttpGet("borrow-history/{userId}")]
        public async Task<ActionResult<IEnumerable<BorrowHistoryDTO>>> GetBorrowHistory(int userId)
        {
            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .Include(r => r.History)
                .Where(r => r.Product.UserId == userId)
                .Select(r => new BorrowHistoryDTO
                {
                    RequestId = r.RequestId,
                    BorrowerId = r.UserId,
                    ProductId = r.ProductId,
                    RequestStatus = r.Status == 0 ? "Pending" :
                                    r.Status == 1 ? "Accepted" : "Rejected",
                    HistoryStatus = r.History == null ? null :
                                    r.History.Status == 0 ? "Not Picked Up" :
                                    r.History.Status == 1 ? "Picked Up" : "Completed",
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.History != null ? r.History.ReturnDate : r.ReturnDate,
                    Rating = r.History != null ? r.History.Rating : null
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
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound();
            }

            return Ok(request);
        }

        // Người mượn xác nhận đã lấy đồ chơi
        [HttpPut("history/{requestId}/pickup")]
        public async Task<ActionResult<HistoryDTO>> ConfirmPickup(int requestId, int userId)
        {
            var history = await _context.Histories
                .FirstOrDefaultAsync(h => h.RequestId == requestId && h.UserId == userId);

            if (history == null)
            {
                return NotFound("History record not found.");
            }

            if (history.Status != 0)
            {
                return BadRequest("Can only confirm pickup from 'not picked up' status.");
            }

            history.Status = 1; // Đã lấy
            await _context.SaveChangesAsync();

            return Ok(new HistoryDTO
            {
                RequestId = history.RequestId,
                UserId = history.UserId,
                ProductId = history.ProductId,
                Status = history.Status,
                Rating = history.Rating,
                ReturnDate = history.ReturnDate
            });
        }

        // Người mượn xác nhận đã trả và đánh giá
        [HttpPut("history/{requestId}/complete")]
        public async Task<ActionResult<HistoryDTO>> ConfirmComplete(int requestId, int userId, int rating)
        {
            var history = await _context.Histories
                .Include(h => h.Product)
                .FirstOrDefaultAsync(h => h.RequestId == requestId && h.UserId == userId);

            if (history == null)
            {
                return NotFound("History record not found.");
            }

            var product = history.Product;
            if (product == null)
            {
                return NotFound("Associated product not found.");
            }

            if (history.Status != 1)
            {
                return BadRequest("Can only complete from 'picked up' status.");
            }

            if (rating < 1 || rating > 5)
            {
                return BadRequest("Rating must be between 1 and 5.");
            }

            history.Status = 2; // Completed
            history.Rating = rating;
            history.ReturnDate = DateTime.UtcNow;
            product.Available = 0;

            await _context.SaveChangesAsync();

            return Ok(new HistoryDTO
            {
                RequestId = history.RequestId,
                UserId = history.UserId,
                ProductId = history.ProductId,
                Status = history.Status,
                Rating = history.Rating,
                ReturnDate = history.ReturnDate
            });
        }

        // Send Feedback After Done
        [HttpPut("history/{requestId}/feedback")]
        public async Task<ActionResult<FeedbackDTO>> SendFeedbackAfterDone(int requestId, int userId, int rating, string comment)
        {
            var history = await _context.Histories
                .Include(h => h.Product)
                .FirstOrDefaultAsync(h => h.RequestId == requestId && h.UserId == userId);

            if (history == null)
            {
                return NotFound("History record not found.");
            }

            if (history.Status != 1 && history.Status != 2)
            {
                return BadRequest("Feedback can only be sent after picking up the product.");
            }

            if (rating < 1 || rating > 5)
            {
                return BadRequest("Rating must be between 1 and 5.");
            }

            history.Status = 2;
            history.Rating = rating;
            history.ReturnDate = DateTime.UtcNow;

            if (history.Product != null)
            {
                history.Product.Available = 0;
            }

            await _context.SaveChangesAsync();

            return Ok(new FeedbackDTO
            {
                HistoryId = history.RequestId,
                Rating = history.Rating.Value,
                Comment = comment
            });
        }

        // Remove Sending Request
        [HttpDelete("{requestId}")]
        public async Task<IActionResult> RemoveSendingRequest(int requestId, int userId)
        {
            var request = await _context.RentRequests
                .FirstOrDefaultAsync(r => r.RequestId == requestId && r.UserId == userId);

            if (request == null)
            {
                return NotFound("Request not found.");
            }

            if (request.Status != 0)
            {
                return BadRequest("Only pending requests can be removed.");
            }

            _context.RentRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Request removed successfully" });
        }
    }
}