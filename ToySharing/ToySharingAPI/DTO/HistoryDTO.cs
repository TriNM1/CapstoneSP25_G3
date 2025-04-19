using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class HistoryDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public string? BorrowerName { get; set; }
        public string BorrowerAvatar { get; set; } // Thêm trường này
        public int ProductId { get; set; }
        public string? ProductName { get; set; }

        public int Status { get; set; }
        public int? Rating { get; set; }
        public string? Message { get; set; }
        public string? OwnerName { get; set; }
        public string OwnerAvatar { get; set; }
        public DateTime ReturnDate { get; set; }
        public string? Image { get; set; }
    }
}