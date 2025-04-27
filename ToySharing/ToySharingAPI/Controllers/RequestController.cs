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
        [HttpPut("{requestId}/confirm-return")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> ConfirmReturn(int requestId)
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
                return NotFound("Yêu cầu không tồn tại.");

            if (request.Status != 3)
                return BadRequest("Chỉ có thể xác nhận trả từ trạng thái 'đã lấy' (status = 3).");

            bool isBorrower = request.UserId == mainUserId;
            bool isOwner = request.Product.UserId == mainUserId;

            if (!isBorrower && !isOwner)
                return Forbid("Bạn không có quyền xác nhận trả cho yêu cầu này.");

            byte currentConfirm = request.ConfirmReturn;

            if (isBorrower)
            {
                if ((currentConfirm & 1) != 0)
                    return BadRequest("Bạn đã xác nhận trả trước đó.");
                currentConfirm |= 1; // Set bit 0
            }
            else if (isOwner)
            {
                if ((currentConfirm & 2) != 0)
                    return BadRequest("Bạn đã xác nhận trả trước đó.");
                currentConfirm |= 2; // Set bit 1
            }

            try
            {
                request.ConfirmReturn = currentConfirm;

                if (currentConfirm == 3) // Cả hai đã xác nhận
                {
                    request.Status = 4; // Completed
                    request.History.Status = 1; // Completed
                    request.History.ReturnDate = DateTime.Now;
                    request.Product.Available = 0; // Sản phẩm sẵn sàng cho thuê lại

                    var borrowerId = request.UserId;
                    var ownerId = request.Product.UserId;
                    var productName = request.Product?.Name ?? "Sản phẩm không xác định";
                    await CreateNotification(
                        borrowerId,
                        $"Yêu cầu mượn sản phẩm '{productName}' đã hoàn thành."
                    );
                    await CreateNotification(
                        ownerId,
                        $"Yêu cầu mượn sản phẩm '{productName}' đã hoàn thành."
                    );
                }
                else
                {
                    var notificationUserId = isBorrower ? request.Product.UserId : request.UserId;
                    var role = isBorrower ? "người mượn" : "chủ sở hữu";
                    var productName = request.Product?.Name ?? "Sản phẩm không xác định";
                    await CreateNotification(
                        notificationUserId,
                        $"{role} đã xác nhận trả sản phẩm '{productName}'. Vui lòng xác nhận để hoàn thành yêu cầu."
                    );
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Xác nhận trả thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi xác nhận trả.",
                    error = ex.Message,
                    requestId
                });
            }
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
                    RequestDate = formData.RequestDate.AddHours(7),
                    RentDate = formData.RentDate.AddHours(7),
                    ReturnDate = formData.ReturnDate.AddHours(7),
                    DepositAmount = product.ProductValue,
                    RentalFee = product.Price
                };

                _context.RentRequests.Add(request);
                await _context.SaveChangesAsync();

                var ownerId = product.UserId;
                var borrower = await _context.Users.FindAsync(mainUserId);
                var borrowerName = borrower?.Displayname ?? "Không xác định";
                await CreateNotification(ownerId, $"{borrowerName} đã gửi yêu cầu mượn '{product.Name}' của bạn .");

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
                    OwnerName = product.User.Displayname,
                    OwnerAvatar = product.User.Avatar, // Thêm OwnerAvatar
                    Status = request.Status,
                    DepositAmount = request.DepositAmount,
                    RetalFee = request.RentalFee
                };

                return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestId }, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the request.", error = ex.Message });
            }
        }

        // Cập nhật trạng thái của một yêu cầu mượn (chấp nhận: status = 1, từ chối: status = 5).
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
                if (requestDto.NewStatus == 1)
                {
                    var totalAmount = request.DepositAmount + request.RentalFee;
                    if (totalAmount == 0)
                    {
                        request.Status = 8; // Chấp nhận, không mất phí
                    }
                    else if (totalAmount >= 1000)
                    {
                        request.Status = 1;
                    }
                    else
                    {
                        return BadRequest("Tổng DepositAmount và RentalFee phải bằng 0 hoặc lớn hơn hoặc bằng 1000.");
                    }

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
                    await CreateNotification(borrowerId, $"Yêu cầu mượn '{productName}' của bạn đã được chấp nhận.");
                }
                else if (requestDto.NewStatus == 5) // Từ chối yêu cầu
                {
                    request.Status = 5;
                    request.Product.Available = 0;

                    // Tạo bản ghi History với trạng thái canceled (2)
                    var history = new History
                    {
                        RequestId = request.RequestId,
                        UserId = request.UserId,
                        ProductId = request.ProductId,
                        Status = 2, // Trạng thái canceled
                        Rating = null,
                        Message = "Yêu cầu bị từ chối bởi chủ sở hữu",
                        ReturnDate = DateTime.Now
                    };
                    _context.Histories.Add(history);

                    await _context.SaveChangesAsync();

                    var borrowerId = request.UserId;
                    var productName = request.Product.Name;
                    await CreateNotification(borrowerId, $"Yêu cầu mượn '{productName}' của bạn đã bị từ chối.");
                }
                else
                {
                    return BadRequest("Giá trị trạng thái không hợp lệ. Trạng thái phải là 1 (Accepted) hoặc 5 (Rejected).");
                }

                return Ok(new { message = "Cập nhật trạng thái yêu cầu thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi cập nhật trạng thái yêu cầu: {ex.ToString()}");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật trạng thái yêu cầu.", error = ex.Message });
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

            if (request.Status != 2 && request.Status != 8)
                return BadRequest("Chỉ có thể đánh dấu đã lấy từ trạng thái 'đã chấp nhận' (status = 2 hoặc 8).");

            if (request.Product == null)
                return BadRequest($"Sản phẩm với ProductId {request.ProductId} không tồn tại.");

            if (request.Product.User == null)
                return BadRequest($"Chủ sở hữu sản phẩm với UserId {request.Product.UserId} không tồn tại.");

            try
            {
                request.Status = 3;
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
                .Where(r => r.UserId == mainUserId && (r.Status == 1 || r.Status == 0 || r.Status == 2 || r.Status == 3 || r.Status == 8))
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
                    confirmReturn = r.ConfirmReturn, // Thêm confirmReturn
                    status = r.Status, // Trả về status trực tiếp
                    image = r.Product.Images.FirstOrDefault() != null ? r.Product.Images.FirstOrDefault().Path : null,
                    depositAmount = r.DepositAmount,
                    rentalFee = r.RentalFee,
                    name = r.User.Displayname,
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
                .Select(h => new HistoryDTO
                {
                    RequestId = h.RequestId,
                    UserId = h.Product.UserId, // Owner's UserId
                    BorrowerName = null,
                    BorrowerAvatar = null,
                    ProductId = h.ProductId,
                    ProductName = h.Product.Name,
                    Status = h.Status,
                    Rating = h.Rating,
                    Message = h.Message,
                    OwnerName = h.Product.User.Displayname ?? "Không xác định",
                    OwnerAvatar = h.Product.User.Avatar,
                    ReturnDate = h.ReturnDate,
                    Image = h.Product.Images.FirstOrDefault() != null ? h.Product.Images.FirstOrDefault().Path : null
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
        public async Task<ActionResult<IEnumerable<object>>> GetBorrowingRequests()
        {
            var  mainUserId = await GetAuthenticatedUserId();
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
                            (r.Status == 0 || r.Status == 1 || r.Status == 2 || r.Status == 3) || r.Status == 8)
                .Select(r => new RequestDTO
                {
                    RequestId = r.RequestId,
                    UserId = r.UserId,
                    BorrowerName = r.User.Name,
                    BorrowerAvatar = r.User.Avatar,
                    ProductId = r.ProductId,
                    ProductName = r.Product.Name,
                    Price = r.Product.Price,
                    DepositAmount = r.DepositAmount,
                    OwnerId = r.Product.UserId,
                    OwnerName = r.Product.User.Name,
                    Message = r.Message,
                    Status = r.Status,
                    ConfirmReturn = r.ConfirmReturn,
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
                Status = r.Status, // Trả về số (0, 1, 2, 3, 4, 7) thay vì chuỗi
                r.ConfirmReturn,
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
                var borrowerName = request.User?.Displayname ?? "Không xác định";

                request.Status = 4; // Completed
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

            if (request.Status != 0 && request.Status != 1)
                return BadRequest("Chỉ có thể hủy từ trạng thái 'chưa chấp nhận' hoặc 'chưa thanh toán'.");

            var history = await _context.Histories
                .FirstOrDefaultAsync(h => h.RequestId == requestId);

            if (history == null)
                try
                {
                    request.Status = 6;
                    await _context.SaveChangesAsync();
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

            try
            {
                if (history != null)
                {
                    request.Status = 6;
                    history.Status = 2; // Canceled
                    history.Message = formData.Reason;
                    history.ReturnDate = DateTime.Now;
                    request.Product.Available = 0;

                    await _context.SaveChangesAsync();
                }
                else
                {
                    history = new History
                    {
                        RequestId = requestId,
                        UserId = mainUserId,
                        ProductId = request.ProductId,
                        Status = 2, // Canceled
                        Message = formData.Reason,
                        ReturnDate = DateTime.Now,
                    };
                    _context.Histories.Add(history);
                }
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
                var borrowerName = borrower?.Displayname ?? "Không xác định";
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
        [HttpPut("{requestId}/mark-not-returned")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> MarkNotReturned(int requestId)
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
                return NotFound("Yêu cầu không tồn tại.");

            if (request.Product.UserId != mainUserId)
                return Forbid("Bạn không có quyền đánh dấu yêu cầu này là chưa trả.");

            if (request.Status != 3)
                return BadRequest("Chỉ có thể đánh dấu chưa trả từ trạng thái 'đã lấy' (status = 3).");

            if ((request.ConfirmReturn & 1) != 0)
                return BadRequest("Người mượn đã xác nhận trả, không thể đánh dấu là chưa trả.");

            var currentDate = DateTime.Now;
            var returnDate = request.ReturnDate;
            var daysOverdue = (currentDate - returnDate).TotalDays;

            if (daysOverdue <= 3)
                return BadRequest("Chỉ có thể đánh dấu chưa trả nếu đã quá 3 ngày kể từ ngày trả dự kiến.");

            try
            {
                request.Status = 7; // Not Returned
                request.History.Status = 3; // Mark history as Not Returned
                request.History.ReturnDate = currentDate;
                request.Product.Available = 0; // Make product available again

                await _context.SaveChangesAsync();

                var borrowerId = request.UserId;
                var ownerId = request.Product.UserId;
                var productName = request.Product?.Name ?? "Sản phẩm không xác định";

                await CreateNotification(
                    borrowerId,
                    $"Yêu cầu mượn sản phẩm '{productName}' đã bị đánh dấu là chưa trả do quá hạn 3 ngày."
                );
                await CreateNotification(
                    ownerId,
                    $"Bạn đã đánh dấu yêu cầu mượn sản phẩm '{productName}' là chưa trả."
                );

                return Ok(new { message = "Đã đánh dấu yêu cầu là chưa trả thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi đánh dấu yêu cầu là chưa trả.",
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