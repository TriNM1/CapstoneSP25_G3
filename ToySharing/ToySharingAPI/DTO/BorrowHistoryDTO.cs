using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class BorrowHistoryDTO
    {
        public int RequestId { get; set; }
        public int BorrowerId { get; set; }

        [StringLength(100, ErrorMessage = "Borrower name cannot exceed 100 characters.")]
        [RegularExpression(@"^[a-zA-Z\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+$",
            ErrorMessage = "Borrower name can only contain letters, spaces, and Vietnamese characters.")]
        public string? BorrowerName { get; set; }

        [StringLength(255, ErrorMessage = "Borrower avatar path cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\-_/\.]+$",
            ErrorMessage = "Borrower avatar path can only contain letters, numbers, hyphens, underscores, slashes, and dots.")]
        public string? BorrowerAvatar { get; set; }

        public int ProductId { get; set; }

        [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+$",
            ErrorMessage = "Product name can only contain letters, numbers, spaces, and Vietnamese characters.")]
        public string? ProductName { get; set; }

        public decimal Price { get; set; }

        [StringLength(255, ErrorMessage = "Image path cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\-_/\.]+$",
            ErrorMessage = "Image path can only contain letters, numbers, hyphens, underscores, slashes, and dots.")]
        public string? Image { get; set; }

        public string? RequestStatus { get; set; }
        public string? HistoryStatus { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime RentDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public int? Rating { get; set; }

        [StringLength(255, ErrorMessage = "Message cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ,.!?]+$",
            ErrorMessage = "Message can only contain letters, numbers, Vietnamese characters, spaces, and basic punctuation (,.!?)")]
        public string? Message { get; set; }
    }
}