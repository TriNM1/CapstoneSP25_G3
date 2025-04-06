using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;
using System.Text.RegularExpressions;
using System;

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

        // Tạo thông báo cho người dùng với nội dung và trạng thái chưa đọc.
        private async Task CreateNotification(int userId, string content)
        {
            var notification = new Notification
            {
                UserId = userId,
                Content = content,
                CreatedDate = DateTime.Now,
                ReadStatus = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        // Lấy ID của người dùng hiện tại từ token xác thực.
        private async Task<int> GetAuthenticatedUserId()
        {
            if (!User.Identity.IsAuthenticated)
                return -1;

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return -1;

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return -1;

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return -1;

            return mainUser.Id;
        }

        // Tạo một yêu cầu mượn mới (RentRequest) với trạng thái mặc định là 0 (pending). Gửi thông báo cho chủ sở hữu đồ chơi. Được sử dụng trong SearchingToy.jsx.
        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<RequestDTO>> CreateRequest([FromForm] CreateRequestDTO formData)
        {
            try
            {
                var mainUserId = await GetAuthenticatedUserId();
                if (mainUserId == -1)
                    return Unauthorized("Không thể xác thực người dùng.");

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
                    RequestDate = formData.RequestDate ?? DateTime.Now,
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the request.", error = ex.Message });
            }
        }

        // Cập nhật trạng thái của một yêu cầu mượn (chấp nhận: status = 1, từ chối: status = 2). Tạo bản ghi History với trạng thái tương ứng. Gửi thông báo cho người mượn. Được sử dụng trong ListBorrowRequests.jsx.
        [HttpPut("{requestId}/status")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdateRequestStatus(int requestId, [FromBody] UpdateRequestStatusDTO requestDto)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var request = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Product.UserId != mainUserId)
                return Forbid("You are not authorized to manage this request.");

            if (request.Status != 0 && requestDto.NewStatus != 0)
                return BadRequest("Cannot change status after initial state.");

            try
            {
                if (requestDto.NewStatus == 1) // Chấp nhận yêu cầu
                {
                    request.Status = 1;
                    request.Product.Available = 1;

                    // Tạo bản ghi History với trạng thái pending (0)
                    var history = new History
                    {
                        RequestId = request.RequestId,
                        UserId = request.UserId,
                        ProductId = request.ProductId,
                        Status = 0, // Trạng thái pending
                        Rating = null,
                        Message = null,
                        ReturnDate = DateTime.Now
                    };
                    _context.Histories.Add(history);

                    await _context.SaveChangesAsync();

                    var borrowerId = request.UserId;
                    var productName = request.Product.Name;
                    await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been accepted.");
                }
                else if (requestDto.NewStatus == 2) // Từ chối yêu cầu
                {
                    request.Status = 2;
                    request.Product.Available = 0;

                    // Tạo bản ghi History với trạng thái canceled (2)
                    var history = new History
                    {
                        RequestId = request.RequestId,
                        UserId = request.UserId,
                        ProductId = request.ProductId,
                        Status = 2, // Trạng thái canceled
                        Rating = null,
                        Message = "Request rejected by owner",
                        ReturnDate = DateTime.Now
                    };
                    _context.Histories.Add(history);

                    await _context.SaveChangesAsync();

                    var borrowerId = request.UserId;
                    var productName = request.Product.Name;
                    await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been rejected.");
                }
                else
                {
                    return BadRequest("Invalid status value. Status must be 1 (Accepted) or 2 (Rejected).");
                }

                return Ok(new { message = "Request status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the request status.", error = ex.Message });
            }
        }

        // Lấy danh sách tất cả yêu cầu mượn liên quan đến đồ chơi của người dùng hiện tại (chủ sở hữu đồ chơi).
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

            return Ok(requests); // Return empty list if no requests are found
        }

        // Lấy lịch sử mượn của người dùng hiện tại (dựa trên vai trò người mượn).
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

            return Ok(history); // Return empty list if no history is found
        }

        // Lấy danh sách yêu cầu mượn mà người dùng hiện tại đã gửi và được chấp nhận (status = 1), không bao gồm các yêu cầu đã bị hủy.
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

            return Ok(requests); // Return empty list if no requests are found
        }

        // Lấy danh sách tất cả yêu cầu mượn mà người dùng hiện tại đã gửi (bao gồm mọi trạng thái). Được sử dụng trong SearchingToy.jsx.
        [HttpGet("my-requests")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<RequestDTO>>> GetMyRequests()
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
                .Where(r => r.UserId == mainUserId) // Lấy các yêu cầu của người dùng hiện tại
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

            return Ok(requests); // Trả về danh sách yêu cầu, bao gồm cả pending (status == 0)
        }

        // Lấy danh sách yêu cầu mượn liên quan đến đồ chơi của người dùng hiện tại (chủ sở hữu) với trạng thái pending (0) hoặc accepted (1).
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
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    RentDate = r.RentDate,
                    ReturnDate = r.ReturnDate,
                    Image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

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
                RequestStatus = r.Status switch
                {
                    0 => "Pending",
                    1 => "Accepted",
                    _ => "Unknown"
                },
                r.RequestDate,
                r.RentDate,
                r.ReturnDate
            });

            return Ok(result); // Return empty list if no requests are found
        }

        // Lấy danh sách yêu cầu mượn liên quan đến đồ chơi của người dùng hiện tại (chủ sở hữu) với trạng thái pending (0). Được sử dụng trong ListBorrowRequests.jsx.
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

            return Ok(requests); // Return empty list if no requests are found
        }

        // Lấy lịch sử mượn của người dùng hiện tại (dựa trên vai trò chủ sở hữu đồ chơi) với trạng thái completed (1) hoặc canceled (2). Được sử dụng trong TransferHistory.jsx.
        [HttpGet("borrow-history")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<BorrowHistoryDTO>>> GetBorrowHistory()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var histories = await _context.Histories
                .Include(h => h.Product)
                .ThenInclude(p => p.Images)
                .Include(h => h.Product)
                .ThenInclude(p => p.User)
                .Where(h => h.Product.UserId == mainUserId && (h.Status == 1 || h.Status == 2))
                .Select(h => new
                {
                    History = h,
                    Borrower = _context.Users
                        .Where(u => u.Id == h.UserId)
                        .Select(u => new { u.Name, u.Avatar })
                        .FirstOrDefault() ?? new { Name = "Không xác định", Avatar = (string)null }
                })
                .Select(x => new BorrowHistoryDTO
                {
                    RequestId = x.History.RequestId,
                    BorrowerId = x.History.UserId,
                    BorrowerName = x.Borrower.Name,
                    BorrowerAvatar = x.Borrower.Avatar,
                    ProductId = x.History.ProductId,
                    ProductName = x.History.Product.Name,
                    Price = x.History.Product.Price,
                    Image = x.History.Product.Images.FirstOrDefault() != null ? x.History.Product.Images.FirstOrDefault().Path : null,
                    RequestStatus = x.History.Status == 1 ? "completed" : "canceled",
                    ReturnDate = x.History.ReturnDate,
                    Rating = x.History.Rating,
                    Message = x.History.Message
                })
                .ToListAsync();

            return Ok(histories); // Return empty list if no histories are found
        }

        // Lấy thông tin chi tiết của một yêu cầu mượn dựa trên ID.
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
                return NotFound("Request not found.");

            return Ok(request);
        }

        // Xác nhận hoàn thành một yêu cầu mượn, cập nhật trạng thái History thành completed (1) và thêm đánh giá/feedback.
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
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                return NotFound("History record not found.");

            if (history.Product.UserId != mainUserId)
                return Forbid("You are not authorized to complete this request.");

            var product = await _context.Products.FindAsync(history.ProductId);
            if (product == null)
                return NotFound("Associated product not found.");

            if (history.Status != 0) // Chỉ cho phép hoàn thành từ trạng thái pending (0)
                return BadRequest("Can only complete from 'pending' status.");

            var request = await _context.RentRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            try
            {
                var borrowerName = request.User != null ? request.User.Name : "Không xác định";

                request.Status = 3; // Đánh dấu RentRequest là completed
                history.Status = 1; // Đánh dấu History là completed
                history.Rating = formData.Rating;
                history.Message = formData.Message;
                history.ReturnDate = DateTime.Now;
                product.Available = 0; // Đặt lại trạng thái đồ chơi thành available

                await _context.SaveChangesAsync();

                var ownerId = product.UserId;
                var notificationContent = $"{borrowerName} has completed renting your product '{product.Name}'";
                if (formData.Rating.HasValue)
                    notificationContent += $" and rated it {formData.Rating}/5";
                if (!string.IsNullOrEmpty(formData.Message))
                    notificationContent += $". Feedback: {formData.Message}";
                else
                    notificationContent += ".";
                await CreateNotification(ownerId, notificationContent);

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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while completing the request.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // Hủy một yêu cầu mượn đã được chấp nhận, cập nhật trạng thái History thành canceled (2) và ghi lại lý do hủy.
        [HttpPut("{requestId}/cancel")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CancelRequest(int requestId, [FromBody] CancelRequestDTO formData)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var request = await _context.RentRequests
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Product.UserId != mainUserId)
                return Forbid("You are not authorized to cancel this request.");

            if (request.Status != 1)
                return BadRequest("Can only cancel from 'accepted' status.");

            var history = await _context.Histories
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                return NotFound("History record not found.");

            try
            {
                request.Status = 4; // Set status to "Canceled"
                history.Status = 2; // Set History status to "Canceled"
                history.Rating = 1;
                history.Message = formData.Reason;
                history.ReturnDate = DateTime.Now;
                request.Product.Available = 0;

                await _context.SaveChangesAsync();

                var borrowerId = request.UserId;
                var productName = request.Product.Name;
                await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been canceled. Reason: {formData.Reason}");

                return Ok(new { message = "Request canceled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while canceling the request.", error = ex.Message });
            }
        }

        public class CancelRequestDTO
        {
            public string Reason { get; set; }
        }
    }
}