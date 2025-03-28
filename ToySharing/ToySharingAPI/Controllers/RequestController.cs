using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;
using System.Text.RegularExpressions;

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

        private async Task CreateNotification(int userId, string content)
        {
            var notification = new Notification
            {
                UserId = userId,
                Content = content,
                CreatedDate = DateTime.UtcNow,
                ReadStatus = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        private async Task<int> GetAuthenticatedUserId()
        {
            // Kiểm tra xem User có được xác thực không
            if (!User.Identity.IsAuthenticated)
                throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                throw new UnauthorizedAccessException("Không tìm thấy thông tin xác thực người dùng.");

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                throw new UnauthorizedAccessException("ID người dùng không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                throw new UnauthorizedAccessException("Không tìm thấy người dùng trong hệ thống.");

            return mainUser.Id;
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<RequestDTO>> CreateRequest([FromForm] CreateRequestDTO formData)
        {
            try
            {
                var mainUserId = await GetAuthenticatedUserId();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var product = await _context.Products
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.ProductId == formData.ProductId);

                if (product == null || product.Available != 0)
                    return BadRequest("Product is not available for rent.");

                if (product.UserId == mainUserId)
                    return BadRequest("You cannot request to rent your own product.");

                var request = new RentRequest
                {
                    UserId = mainUserId,
                    ProductId = formData.ProductId,
                    Message = formData.Message?.Trim(),
                    Status = 0,
                    RequestDate = formData.RequestDate ?? DateTime.UtcNow,
                    RentDate = formData.RentDate,
                    ReturnDate = formData.ReturnDate
                };

                _context.RentRequests.Add(request);
                await _context.SaveChangesAsync();

                var ownerId = product.UserId;
                var borrower = await _context.Users.FindAsync(mainUserId);
                var borrowerName = borrower?.Name ?? "Không xác định";
                await CreateNotification(ownerId, $"{borrowerName} has requested to rent your product '{product.Name}'.");

                var response = new RequestDTO
                {
                    RequestId = request.RequestId,
                    UserId = request.UserId,
                    RequestDate = request.RequestDate,
                    ProductId = request.ProductId,
                    ProductName = product.Name,
                    Price = product.Price,
                    BorrowerName = borrowerName,
                    BorrowerAvatar = borrower?.Avatar,
                    OwnerId = product.UserId,
                    OwnerName = product.User.Name,
                    Status = request.Status
                };

                return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestId }, response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpPut("{requestId}/status")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<RequestStatusDTO>> ConfirmOrRejectBorrowingRequest(int requestId, [FromForm] UpdateRequestStatusDTO formData)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var request = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Product.UserId != mainUserId)
                return Forbid("You are not authorized to manage this request.");

            var product = request.Product;
            if (product == null)
                return NotFound("Associated product not found.");

            var borrowerId = request.UserId;
            var productName = product.Name;

            switch (formData.NewStatus)
            {
                case 1:
                    if (request.Status != 0)
                        return BadRequest("Request can only be approved from 'pending' status.");
                    request.Status = 1;
                    product.Available = 1;
                    var history = new History
                    {
                        RequestId = request.RequestId,
                        UserId = request.UserId,
                        ProductId = request.ProductId,
                        Status = 1,
                        ReturnDate = request.ReturnDate
                    };
                    _context.Histories.Add(history);
                    await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been accepted.");
                    break;

                case 2:
                    if (request.Status != 0)
                        return BadRequest("Request can only be rejected from 'pending' status.");
                    request.Status = 2;
                    product.Available = 0;
                    await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been rejected.");
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

        [HttpGet("user")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetRequestsByUserId()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .Where(r => r.Product.UserId == mainUserId)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    OwnerId = r.Product.UserId,
                    OwnerName = r.Product.User.Name,
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("history")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<HistoryDTO>>> GetRequestHistory()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var history = await _context.Histories
                .Include(h => h.Product)
                .ThenInclude(p => p.Images)
                .Include(h => h.Product)
                .ThenInclude(p => p.User)
                .Where(h => h.UserId == mainUserId)
                .Select(h => new
                {
                    History = h,
                    BorrowerName = _context.RentRequests
                        .Where(r => r.RequestId == h.RequestId)
                        .Include(r => r.User)
                        .Select(r => r.User.Name)
                        .FirstOrDefault() ?? "Không xác định"
                })
                .Select(x => new HistoryDTO
                {
                    RequestId = x.History.RequestId,
                    UserId = x.History.UserId,
                    BorrowerName = x.BorrowerName,
                    ProductId = x.History.ProductId,
                    ProductName = x.History.Product.Name,
                    Status = x.History.Status,
                    Rating = x.History.Rating,
                    Message = x.History.Message,
                    ReturnDate = x.History.ReturnDate,
                    Image = x.History.Product.Images.FirstOrDefault() != null ? x.History.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("toy-request")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<object>>> GetToyRequestList()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Where(r => r.UserId == mainUserId && r.Status == 1)
                .Include(r => r.User)
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.History)
                .Where(r => r.History == null || r.History.Status != 2)
                .Select(r => new
                {
                    RequestId = r.RequestId,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    OwnerName = r.Product.User.Name,
                    BorrowDate = r.RentDate,
                    ReturnDate = r.ReturnDate,
                    Message = r.Message,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            if (!requests.Any())
                return NotFound("No toys currently being borrowed.");

            return Ok(requests);
        }

        [HttpGet("borrowing")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetBorrowingRequests()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .Include(r => r.History)
                .Where(r => r.Product.UserId == mainUserId && (r.Status == 0 || r.Status == 1))
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    OwnerId = r.Product.UserId,
                    OwnerName = r.Product.User.Name,
                    Message = r.Message,
                    MessageFeedback = r.History != null ? r.History.Message : null,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.History != null ? r.History.ReturnDate : r.ReturnDate,
                    Rating = r.History != null ? r.History.Rating : null,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            if (!requests.Any())
                return NotFound("No borrowing requests found.");

            var result = requests.Select(r => new
            {
                r.RequestId,
                r.UserId,
                r.BorrowerName,
                r.BorrowerAvatar,
                r.ProductId,
                r.ProductName,
                r.Price,
                r.Image,
                RequestStatus = r.Status == 0 ? "Pending" : r.Status == 1 ? "Accepted" : "Unknown",
                r.RequestDate,
                r.RentDate,
                r.ReturnDate
            });

            return Ok(result);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetPendingRequests()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .Where(r => r.Product.UserId == mainUserId && r.Status == 0)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    OwnerId = r.Product.UserId,
                    OwnerName = r.Product.User.Name,
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("borrow-history")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<BorrowHistoryDTO>>> GetBorrowHistory()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .Include(r => r.History)
                .Where(r => r.Product.UserId == mainUserId && r.Status == 1)
                .Select(r => new BorrowHistoryDTO
                {
                    RequestId = r.RequestId,
                    BorrowerId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null,
                    RequestStatus = r.Status == 0 ? "Pending" :
                                    r.Status == 1 ? "Accepted" :
                                    r.Status == 2 ? "Rejected" : "Canceled",
                    HistoryStatus = r.History == null ? null :
                                    r.History.Status == 1 ? "Accepted" : "Completed",
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.History != null ? r.History.ReturnDate : r.ReturnDate,
                    Rating = r.History != null ? r.History.Rating : null,
                    Message = r.History != null ? r.History.Message : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<RequestDTO>> GetRequestById(int id)
        {
            var request = await _context.RentRequests
                .Include(r => r.User)
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.History)
                .Where(r => r.RequestId == id)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    OwnerId = r.Product.UserId,
                    OwnerName = r.Product.User.Name,
                    Message = r.Message,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.History != null ? r.History.ReturnDate : r.ReturnDate,
                    Rating = r.History != null ? r.History.Rating : null,
                    MessageFeedback = r.History != null ? r.History.Message : null,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .FirstOrDefaultAsync();

            if (request == null)
                return NotFound();

            return Ok(request);
        }

        [HttpPut("history/{requestId}/complete")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<HistoryDTO>> ConfirmComplete(int requestId, [FromBody] CompleteRequestDTO formData)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var history = await _context.Histories
                .Include(h => h.Product)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(h => h.RequestId == requestId && h.UserId == mainUserId);

            if (history == null)
                return NotFound("History record not found.");

            var product = history.Product;
            if (product == null)
                return NotFound("Associated product not found.");

            if (history.Status != 1)
                return BadRequest("Can only complete from 'accepted' status.");

            history.Status = 2;
            history.Rating = formData.Rating; // Có thể null
            history.Message = formData.Message; // Có thể null
            history.ReturnDate = DateTime.UtcNow;
            product.Available = 0;

            var borrowerName = await _context.RentRequests
                .Where(r => r.RequestId == history.RequestId)
                .Include(r => r.User)
                .Select(r => r.User.Name)
                .FirstOrDefaultAsync() ?? "Không xác định";
            var ownerId = product.UserId;

            var notificationContent = $"{borrowerName} has completed renting your product '{product.Name}'";
            if (formData.Rating.HasValue)
                notificationContent += $" and rated it {formData.Rating}/5";
            if (!string.IsNullOrEmpty(formData.Message))
                notificationContent += $". Feedback: {formData.Message}";
            else
                notificationContent += ".";
            await CreateNotification(ownerId, notificationContent);

            await _context.SaveChangesAsync();

            return Ok(new HistoryDTO
            {
                RequestId = history.RequestId,
                UserId = history.UserId,
                BorrowerName = borrowerName,
                ProductId = history.ProductId,
                ProductName = history.Product.Name,
                Status = history.Status,
                Rating = history.Rating,
                Message = history.Message,
                ReturnDate = history.ReturnDate
            });
        }

        [HttpPut("{requestId}/cancel")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CancelAcceptedRequest(int requestId, [FromBody] CancelRequestDTO cancelDto)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var request = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .Include(r => r.History)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Product.UserId != mainUserId)
                return Forbid("You are not authorized to manage this request.");

            if (request.Status != 1)
                return BadRequest("Only accepted requests can be canceled.");

            // Hủy yêu cầu
            request.Status = 3;
            request.Product.Available = 0;

            // Cập nhật History để hoàn thành và gán rating 1 sao
            if (request.History != null)
            {
                request.History.Status = 2; // Hoàn thành
                request.History.Rating = 1; // Gán rating 1 sao
                request.History.ReturnDate = DateTime.UtcNow;
                request.History.Message = $"Request canceled by owner due to report. Reason: {cancelDto.Reason}";
            }
            else
            {
                // Nếu chưa có History, tạo mới
                var history = new History
                {
                    RequestId = request.RequestId,
                    UserId = request.UserId,
                    ProductId = request.ProductId,
                    Status = 2,
                    Rating = 1,
                    Message = $"Request canceled by owner due to report. Reason: {cancelDto.Reason}",
                    ReturnDate = DateTime.UtcNow
                };
                _context.Histories.Add(history);
            }

            var borrowerId = request.UserId;
            var productName = request.Product.Name;
            await CreateNotification(borrowerId, $"The request to rent '{productName}' has been canceled by the owner and rated 1 star due to a report. Reason: {cancelDto.Reason}");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Request canceled successfully with 1-star rating" });
        }

        // DTO cho cancel request
        public class CancelRequestDTO
        {
            public string Reason { get; set; }
        }
    }
}