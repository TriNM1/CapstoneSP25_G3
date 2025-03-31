using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class HistoryDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }

        [StringLength(100, ErrorMessage = "Borrower name cannot exceed 100 characters.")]
        [RegularExpression(@"^[a-zA-Z\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+$",
            ErrorMessage = "Borrower name can only contain letters, spaces, and Vietnamese characters.")]
        public string? BorrowerName { get; set; }

        public int ProductId { get; set; }

        [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ]+$",
            ErrorMessage = "Product name can only contain letters, numbers, spaces, and Vietnamese characters.")]
        public string? ProductName { get; set; }

        public int Status { get; set; }
        public int? Rating { get; set; }

        [StringLength(255, ErrorMessage = "Message cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ,.!?]+$",
            ErrorMessage = "Message can only contain letters, numbers, Vietnamese characters, spaces, and basic punctuation (,.!?)")]
        public string? Message { get; set; }

        public DateTime ReturnDate { get; set; }

        [StringLength(255, ErrorMessage = "Image path cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\-_/\.]+$",
            ErrorMessage = "Image path can only contain letters, numbers, hyphens, underscores, slashes, and dots.")]
        public string? Image { get; set; }
    }
}