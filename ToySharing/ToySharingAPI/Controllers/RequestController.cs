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

        // Tạo một yêu cầu mượn mới (RentRequest) với trạng thái mặc định là 0 (pending). Gửi thông báo cho chủ sở hữu đồ chơi.
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
                    OwnerAvatar = product.User.Avatar, // Thêm OwnerAvatar
                    Status = request.Status
                };

                return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestId }, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the request.", error = ex.Message });
            }
        }

        // Cập nhật trạng thái của một yêu cầu mượn (chấp nhận: status = 1, từ chối: status = 4).
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
                else if (requestDto.NewStatus == 4) // Từ chối yêu cầu
                {
                    request.Status = 4;
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
                    return BadRequest("Invalid status value. Status must be 1 (Accepted) or 4 (Rejected).");
                }

                return Ok(new { message = "Request status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the request status.", error = ex.Message });
            }
        }

        [HttpPut("{requestId}/picked-up")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> MarkPickedUp(int requestId)
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
                return NotFound($"Yêu cầu với ID {requestId} không tồn tại.");

            if (request.UserId != mainUserId)
                return Forbid("Bạn không có quyền đánh dấu yêu cầu này là đã lấy.");

            if (request.Status != 1)
                return BadRequest("Chỉ có thể đánh dấu đã lấy từ trạng thái 'đã chấp nhận' (status = 1).");

            if (request.Product == null)
                return BadRequest($"Sản phẩm với ProductId {request.ProductId} không tồn tại.");

            if (request.Product.User == null)
                return BadRequest($"Chủ sở hữu sản phẩm với UserId {request.Product.UserId} không tồn tại.");

            try
            {
                request.Status = 2;
                await _context.SaveChangesAsync();

                var ownerId = request.Product.UserId;
                var productName = request.Product.Name ?? "Sản phẩm không xác định";
                await CreateNotification(ownerId, $"Sản phẩm '{productName}' của bạn đã được người mượn lấy.");

                return Ok(new { message = "Đã đánh dấu yêu cầu là đã lấy thành công." });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi cơ sở dữ liệu khi cập nhật trạng thái yêu cầu.",
                    error = dbEx.InnerException?.Message ?? dbEx.Message,
                    requestId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi không xác định khi đánh dấu yêu cầu là đã lấy.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace,
                    requestId
                });
            }
        }

        // Sửa endpoint toy-request để trả về cả status = 1 và 2 (Accepted và PickedUp)
        [HttpGet("toy-request")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<IEnumerable<object>>> GetToyRequestList()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var requests = await _context.RentRequests
                .Where(r => r.UserId == mainUserId && (r.Status == 1 || r.Status == 2))
                .Include(r => r.User)
                .Include(r => r.Product)
                .ThenInclude(p => p.Images)
                .Include(r => r.Product)
                .ThenInclude(p => p.User)
                .Include(r => r.History)
                .Select(r => new
                {
                    requestId = r.RequestId,
                    productId = r.ProductId,
                    productName = r.Product.Name,
                    ownerId = r.Product.UserId,
                    ownerName = r.Product.User.Name,
                    ownerAvatar = r.Product.User.Avatar,
                    borrowDate = r.RentDate,
                    returnDate = r.ReturnDate,
                    requestDate = r.RequestDate,
                    message = r.Message,
                    status = r.Status, // Trả về status trực tiếp
                    image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        // Các endpoint khác giữ nguyên...
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
                .Where(r => r.UserId == mainUserId)
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
                .Where(r => r.Product.UserId == mainUserId &&
                            (r.Status == 0 || r.Status == 1 || r.Status == 2))
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
                    2 => "PickedUp",
                    _ => "Unknown"
                },
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

        // Update borrow-history to ensure correct status mapping
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

            return Ok(histories);
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
                return NotFound("Request not found.");

            return Ok(request);
        }

        [HttpPut("history/{requestId}/complete")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<HistoryDTO>> ConfirmComplete(int requestId)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var history = await _context.Histories
                .Include(h => h.Product)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                return NotFound("Bản ghi lịch sử không tồn tại.");

            if (history.UserId != mainUserId)
                return Forbid("Bạn không có quyền hoàn thành yêu cầu này.");

            var product = await _context.Products.FindAsync(history.ProductId);
            if (product == null)
                return NotFound("Sản phẩm liên quan không tồn tại.");

            if (history.Status != 0)
                return BadRequest("Chỉ có thể hoàn thành từ trạng thái 'đang chờ'.");

            var request = await _context.RentRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Yêu cầu không tồn tại.");

            try
            {
                var borrowerName = request.User?.Name ?? "Không xác định";

                request.Status = 3; // Completed
                history.Status = 1; // Completed
                history.ReturnDate = DateTime.Now;
                product.Available = 0; // Product available again

                await _context.SaveChangesAsync();

                var ownerId = product.UserId;
                var productName = product.Name ?? "Sản phẩm không xác định";
                await CreateNotification(
                    ownerId,
                    $"{borrowerName} đã hoàn thành việc mượn sản phẩm '{productName}'. Vui lòng đánh giá người mượn trong lịch sử giao dịch."
                );

                return Ok(new HistoryDTO
                {
                    RequestId = history.RequestId,
                    UserId = history.UserId,
                    BorrowerName = borrowerName,
                    ProductId = history.ProductId,
                    ProductName = product.Name,
                    Status = history.Status,
                    Rating = history.Rating, // Will be null
                    Message = history.Message,
                    ReturnDate = history.ReturnDate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi hoàn thành yêu cầu.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message,
                    requestId
                });
            }
        }

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
                return NotFound("Yêu cầu không tồn tại.");

            if (request.UserId != mainUserId)
                return Forbid("Bạn không có quyền hủy yêu cầu này.");

            if (request.Status != 1 && request.Status != 2)
                return BadRequest("Chỉ có thể hủy từ trạng thái 'đã chấp nhận' hoặc 'đã lấy'.");

            var history = await _context.Histories
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                return NotFound("Bản ghi lịch sử không tồn tại.");

            try
            {
                request.Status = 5; // Changed to 5 for Canceled
                history.Status = 2; // Canceled
                history.Message = formData.Reason;
                history.ReturnDate = DateTime.Now;
                request.Product.Available = 0;

                await _context.SaveChangesAsync();

                var ownerId = request.Product.UserId;
                var productName = request.Product.Name ?? "Sản phẩm không xác định";
                await CreateNotification(ownerId, $"Yêu cầu mượn sản phẩm '{productName}' đã bị hủy bởi người mượn. Lý do: {formData.Reason}");

                return Ok(new { message = "Hủy yêu cầu thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi hủy yêu cầu.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
        [HttpPut("history/{requestId}/rate")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> RateHistory(int requestId, [FromBody] CompleteRequestDTO rateDto)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var history = await _context.Histories
                .Include(h => h.Product)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                return NotFound("Bản ghi lịch sử không tồn tại.");

            if (history.Product.UserId != mainUserId)
                return Forbid("Bạn không có quyền đánh giá lịch sử này.");

            if (history.Status != 1)
                return BadRequest("Chỉ có thể đánh giá lịch sử đã hoàn thành (status = 1).");

            if (history.Rating.HasValue)
                return BadRequest("Lịch sử này đã được đánh giá.");

            try
            {
                history.Rating = rateDto.Rating;
                history.Message = rateDto.Message?.Trim();
                await _context.SaveChangesAsync();

                var borrower = await _context.Users.FindAsync(history.UserId);
                var borrowerName = borrower?.Name ?? "Không xác định";
                var productName = history.Product?.Name ?? "Sản phẩm không xác định";
                await CreateNotification(
                    history.UserId,
                    $"Bạn đã nhận được đánh giá từ chủ sở hữu '{productName}'."
                );

                return Ok(new { message = "Đánh giá đã được gửi thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi gửi đánh giá.",
                    error = ex.Message,
                    requestId
                });
            }
        }
        public class CancelRequestDTO
        {
            public string Reason { get; set; }
        }
    }
}