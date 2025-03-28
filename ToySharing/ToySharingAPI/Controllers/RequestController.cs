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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the request.", error = ex.Message });
            }
        }

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

                    var existingHistory = await _context.Histories
                        .FirstOrDefaultAsync(h => h.RequestId == requestId);

                    if (existingHistory == null)
                    {
                        var history = new History
                        {
                            RequestId = request.RequestId,
                            UserId = request.UserId,
                            ProductId = request.ProductId,
                            Status = 1,
                            Rating = null,
                            Message = null,
                            ReturnDate = DateTime.UtcNow 
                        };
                        _context.Histories.Add(history);
                    }
                    else
                    {
                        existingHistory.Status = 1;
                        existingHistory.ReturnDate = DateTime.UtcNow;
                    }

                    await _context.SaveChangesAsync();

                    var borrowerId = request.UserId;
                    var productName = request.Product.Name;
                    await CreateNotification(borrowerId, $"Your request to rent '{productName}' has been accepted.");
                }
                else if (requestDto.NewStatus == 2) // Từ chối yêu cầu
                {
                    request.Status = 2;
                    request.Product.Available = 0;

                    var existingHistory = await _context.Histories
                        .FirstOrDefaultAsync(h => h.RequestId == requestId);

                    if (existingHistory != null)
                    {
                        existingHistory.Status = 2;
                        existingHistory.Message = "Request rejected by owner";
                        existingHistory.ReturnDate = DateTime.UtcNow;
                    }

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

            var product = history.Product;
            if (product == null)
                return NotFound("Associated product not found.");

            if (history.Status != 1)
                return BadRequest("Can only complete from 'accepted' status.");

            var request = await _context.RentRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (request == null)
                return NotFound("Request not found.");

            try
            {
                var borrowerName = request.User != null ? request.User.Name : "Không xác định";
                var productId = request.ProductId;

                request.Status = 3; // Set status to "Completed"
                history.Status = 1; // Hoàn thành
                history.Rating = formData.Rating;
                history.Message = formData.Message;
                history.ReturnDate = DateTime.UtcNow;
                product.Available = 0;

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
                history.Status = 2;
                history.Rating = 1;
                history.Message = formData.Reason;
                history.ReturnDate = DateTime.UtcNow;
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