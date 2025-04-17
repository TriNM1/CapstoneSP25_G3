using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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

        /// <summary>
        /// API callback từ MoMo sau khi thanh toán.
        /// </summary>
        [HttpGet("callback")]
        public async Task<IActionResult> PaymentCallback([FromQuery] Dictionary<string, string> queryParams)
        {
            var momoExecuteResponse = await _momoService.PaymentExecuteAsync(queryParams);

            // Cập nhật trạng thái giao dịch trong DB nếu tìm thấy giao dịch tương ứng
            var transaction = await _mainContext.Transactions.FirstOrDefaultAsync(t => t.MomoTransactionId == momoExecuteResponse.OrderId);
            if (transaction != null)
            {
                transaction.Status = 1; // 1: Completed
                transaction.UpdatedAt = DateTime.Now;
                await _mainContext.SaveChangesAsync();

                // Có thể thêm logic gọi service khác nếu cần, ví dụ: cập nhật trạng thái yêu cầu mượn
                var updateDto = new
                {
                    BorrowerId = transaction.FromUserId,
                    ToyId = transaction.RequestId,
                    Status = "completed"
                };
            }

            return Ok(momoExecuteResponse);
        }

        /// <summary>
        /// Kiểm tra trạng thái thanh toán theo transaction_id.
        /// </summary>
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

        /// <summary>
        /// Xem lịch sử giao dịch của người mượn theo borrower_id.
        /// </summary>
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
    }
}
