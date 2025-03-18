using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class CompleteRequestDTO
    {
        [Required(ErrorMessage = "Rating is required.")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
        public int Rating { get; set; }

        [StringLength(255, ErrorMessage = "Message cannot exceed 255 characters.")]
        [RegularExpression(@"^[a-zA-Z0-9\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđĐ,.!?]+$",
            ErrorMessage = "Message can only contain letters, numbers, Vietnamese characters, spaces, and basic punctuation (,.!?)")]
        public string? Message { get; set; }
    }
}
