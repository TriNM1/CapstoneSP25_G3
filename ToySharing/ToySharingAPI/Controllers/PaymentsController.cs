using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.DTO.MoMo;
using ToySharingAPI.Models;
using ToySharingAPI.Service;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IMomoService _momoService;
        private readonly ToySharingVer3Context _mainContext;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IMomoService momoService, ToySharingVer3Context mainContext, ILogger<PaymentsController> logger)
        {
            _momoService = momoService;
            _mainContext = mainContext;
            _logger = logger;
        }

        // Hàm hỗ trợ lấy mainUserId từ JWT token
        private async Task<int> GetAuthenticatedUserId()
        {
            if (!User.Identity.IsAuthenticated)
                throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                throw new UnauthorizedAccessException("Không tìm thấy thông tin xác thực người dùng.");

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                throw new UnauthorizedAccessException("ID người dùng không hợp lệ.");

            var mainUser = await _mainContext.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                throw new UnauthorizedAccessException("Không tìm thấy người dùng trong hệ thống.");

            return mainUser.Id;
        }

        /// Tạo thanh toán mới.
        /// Client gửi JSON theo định dạng OrderCreateDTO, service gọi MoMo, lưu giao dịch vào DB và trả về thông tin thanh toán.
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] OrderCreateDTO dto)
        {
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            var mainUser = await _mainContext.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            var mainUserDisplayName = mainUser.Displayname;

            var borrowerId = await GetAuthenticatedUserId();
            // Map từ DTO sang model dùng cho MoMo
            var orderModel = new OrderInfoModel
            {
                Name = dto.Name,
                OrderInfo = dto.OrderInfo,
                Amount = (double)(dto.DepositAmount + dto.RentalFee)
            };

            var momoResponse = await _momoService.CreatePaymentAsync(orderModel);

            // Lưu giao dịch vào bảng Transaction
            var transactionEntity = new Transaction
            {
                RequestId = dto.RequestId,
                TransactionType = 0,
                Amount = dto.DepositAmount + dto.RentalFee,
                FromUserId = borrowerId,
                ToUserId = null,
                Status = 0, //0: pending
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                MomoTransactionId = momoResponse.OrderId
            };

            _mainContext.Transactions.Add(transactionEntity);
            await _mainContext.SaveChangesAsync();

            var responseDto = new PaymentResponseDTO
            {
                OrderId = momoResponse.OrderId,
                PayUrl = momoResponse.PayUrl
            };

            return Ok(responseDto);
        }


        /// API callback từ MoMo sau khi thanh toán.
        //[HttpGet("callback")]
        //public async Task<IActionResult> PaymentCallback([FromQuery] Dictionary<string, string> queryParams)
        //{
        //    var momoExecuteResponse = await _momoService.PaymentExecuteAsync(queryParams);

        //    // Cập nhật trạng thái giao dịch trong DB nếu tìm thấy giao dịch tương ứng
        //    var transaction = await _mainContext.Transactions.FirstOrDefaultAsync(t => t.MomoTransactionId == momoExecuteResponse.OrderId);
        //    if (transaction != null)
        //    {
        //        transaction.Status = 1; // 1: Completed
        //        transaction.UpdatedAt = DateTime.Now;

        //        var request = await _mainContext.RentRequests.FindAsync(transaction.RequestId);
        //        if (request != null)
        //        {
        //            request.Status = 2; // 2: Đã thanh toán
        //            _mainContext.RentRequests.Update(request);
        //        }
        //        await _mainContext.SaveChangesAsync();
        //        var user = await _mainContext.Users.FindAsync(transaction.FromUserId);
        //        var displayName = user?.Displayname ?? "Người dùng";

        //        var redirectUrl = $"http://localhost:5173/payment-success" +
        //                         $"?orderId={momoExecuteResponse.OrderId}" +
        //                         $"&amount={transaction.Amount}" +
        //                         $"&orderInfo={Uri.EscapeDataString(momoExecuteResponse.OrderInfo ?? "Thanh toán mượn đồ chơi")}" +
        //                         $"&displayName={Uri.EscapeDataString(displayName)}";

        //        return Redirect(redirectUrl);
        //    }

        //    return Redirect("http://localhost:5173/payment-error");
        //}

        /// API callback từ MoMo sau khi thanh toán.
        [HttpGet("callback")]
        public async Task<IActionResult> PaymentCallback([FromQuery] Dictionary<string, string> queryParams)
        {
            // Log query parameters
            _logger.LogInformation("MoMo Callback Query Params: {QueryParams}", string.Join(", ", queryParams.Select(kvp => $"{kvp.Key}={kvp.Value}")));

            var momoExecuteResponse = await _momoService.PaymentExecuteAsync(queryParams);

            // Log MoMo response
            _logger.LogInformation("MoMo Execute Response: OrderId={OrderId}, ResultCode={ResultCode}, Message={Message}",
                momoExecuteResponse.OrderId, momoExecuteResponse.ResultCode, momoExecuteResponse.Message);

            // Kiểm tra trạng thái giao dịch
            bool isSuccess = false;
            if (queryParams.ContainsKey("errorCode") && int.TryParse(queryParams["errorCode"], out var errorCode))
            {
                isSuccess = errorCode == 0;
            }
            else if (queryParams.ContainsKey("resultCode") && int.TryParse(queryParams["resultCode"], out var resultCode))
            {
                isSuccess = resultCode == 0;
            }
            else
            {
                _logger.LogWarning("Missing errorCode or resultCode in MoMo callback. Falling back to message check.");
                isSuccess = queryParams.ContainsKey("message") && queryParams["message"].ToLower() == "success";
            }

            var transaction = await _mainContext.Transactions.FirstOrDefaultAsync(t => t.MomoTransactionId == momoExecuteResponse.OrderId);

            if (!isSuccess)
            {
                _logger.LogWarning("Transaction failed or canceled. ErrorCode: {ErrorCode}, ResultCode: {ResultCode}, Message: {Message}",
                    queryParams.GetValueOrDefault("errorCode", "N/A"),
                    queryParams.GetValueOrDefault("resultCode", "N/A"),
                    queryParams.GetValueOrDefault("message", "N/A"));
                if (transaction != null)
                {
                    transaction.Status = 2; // 2: Failed
                    transaction.UpdatedAt = DateTime.Now;
                    await _mainContext.SaveChangesAsync();
                }
                var errorMessage = queryParams.ContainsKey("message") ? Uri.EscapeDataString(queryParams["message"]) : "Giao dịch bị hủy hoặc thất bại";
                return Redirect($"http://localhost:5173/payment-error?message={errorMessage}");
            }

            // Giao dịch thành công
            if (transaction != null)
            {
                transaction.Status = 1; // 1: Completed
                transaction.UpdatedAt = DateTime.Now;

                var request = await _mainContext.RentRequests.FindAsync(transaction.RequestId);
                if (request != null)
                {
                    request.Status = 2; // 2: Đã thanh toán
                    _mainContext.RentRequests.Update(request);
                }

                await _mainContext.SaveChangesAsync();

                var user = await _mainContext.Users.FindAsync(transaction.FromUserId);
                var displayName = user?.Displayname ?? "Người dùng";

                var redirectUrl = $"http://localhost:5173/payment-success" +
                                 $"?orderId={momoExecuteResponse.OrderId}" +
                                 $"&amount={transaction.Amount}" +
                                 $"&orderInfo={Uri.EscapeDataString(momoExecuteResponse.OrderInfo ?? "Thanh toán mượn đồ chơi")}" +
                                 $"&displayName={Uri.EscapeDataString(displayName)}";

                return Redirect(redirectUrl);
            }

            _logger.LogError("Transaction not found for OrderId: {OrderId}", momoExecuteResponse.OrderId);
            return Redirect($"http://localhost:5173/payment-error?message={Uri.EscapeDataString("Không tìm thấy giao dịch")}");
        }

        /// Kiểm tra trạng thái thanh toán theo transaction_id.
        [HttpGet("{transactionId:int}")]
        public async Task<IActionResult> GetPaymentStatus([FromRoute] int transactionId)
        {
            var transaction = await _mainContext.Transactions.FindAsync(transactionId);
            if (transaction == null)
            {
                return NotFound(new { Message = "Transaction not found" });
            }

            var result = new
            {
                transaction.TransactionId,
                transaction.MomoTransactionId,
                transaction.Amount,
                transaction.Status,
                transaction.CreatedAt,
                transaction.UpdatedAt
            };

            return Ok(result);
        }


        /// Xem lịch sử giao dịch của người mượn theo borrower_id.
        [HttpGet]
        public async Task<IActionResult> GetPaymentsByBorrower([FromQuery(Name = "borrower_id")] int borrowerId)
        {
            var transactions = await _mainContext.Transactions
                .Where(t => t.FromUserId == borrowerId)
                .ToListAsync();

            if (transactions == null || !transactions.Any())
            {
                return NotFound(new { Message = "No transactions found for the borrower" });
            }

            return Ok(transactions);
        }

        // Lấy lịch sử giao dịch thành công của người dùng hiện tại
        [HttpGet("successful")]
        public async Task<IActionResult> GetSuccessfulTransactions()
        {
            // Lấy Claim NameIdentifier từ JWT token
            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                return Unauthorized();

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                return Unauthorized("User id không hợp lệ.");

            // Tìm user trong DB chính theo trường auth_user_id
            var mainUser = await _mainContext.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                return Unauthorized("Không tìm thấy user trong cơ sở dữ liệu.");

            int mainUserId = mainUser.Id;

            // Lấy danh sách giao dịch thành công của user
            var transactions = await _mainContext.Transactions
                .Include(t => t.Request) // Bao gồm thông tin yêu cầu mượn
                .Where(t => t.FromUserId == mainUserId && t.Status == 1) // Chỉ lấy giao dịch thành công
                .OrderByDescending(t => t.CreatedAt) // Sắp xếp theo thời gian tạo, mới nhất trước
                .ToListAsync();

            var transactionSummaries = new List<TransactionSummaryDTO>();

            foreach (var transaction in transactions)
            {
                transactionSummaries.Add(new TransactionSummaryDTO
                {
                    TransactionId = transaction.TransactionId,
                    MomoTransactionId = transaction.MomoTransactionId,
                    Amount = transaction.Amount,
                    RequestId = transaction.RequestId,
                    CreatedAt = transaction.CreatedAt.GetValueOrDefault(),
                    UpdatedAt = transaction.UpdatedAt.GetValueOrDefault()
                });
            }

            if (!transactionSummaries.Any())
            {
                return NotFound(new { Message = "Không tìm thấy giao dịch thành công nào." });
            }

            return Ok(transactionSummaries);
        }
    }
}
