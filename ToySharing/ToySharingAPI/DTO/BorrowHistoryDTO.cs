using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class BorrowHistoryDTO
    {
        public int RequestId { get; set; }
        public int BorrowerId { get; set; }
        public string BorrowerName { get; set; }
        public string BorrowerAvatar { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal? Price { get; set; }
        public string Image { get; set; }
        public string RequestStatus { get; set; }
        public DateTime? ReturnDate { get; set; }
        public int? Rating { get; set; }
        public string Message { get; set; }
    }
}