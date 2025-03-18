using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class CreateRequestDTO
    {
        [Required(ErrorMessage = "Product ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Product ID must be a positive integer.")]
        public int ProductId { get; set; }

        [StringLength(255, ErrorMessage = "Message cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ,.!?]+$",
            ErrorMessage = "Message can only contain letters, numbers, Vietnamese characters, spaces, and basic punctuation (,.!?)")]
        public string? Message { get; set; }

        public DateTime? RequestDate { get; set; }

        [Required(ErrorMessage = "Rent date is required.")]
        public DateTime RentDate { get; set; }

        [Required(ErrorMessage = "Return date is required.")]
        public DateTime ReturnDate { get; set; }
    }
}
