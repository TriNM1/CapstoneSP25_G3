using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class CreateRequestDTO
    {
        [Required(ErrorMessage = "Product ID is required.")]
        public int ProductId { get; set; }

        [StringLength(255, ErrorMessage = "Message cannot exceed 255 characters.")]
        public string? Message { get; set; }

        public DateTime RequestDate { get; set; }

        [Required(ErrorMessage = "Rent date is required.")]
        public DateTime RentDate { get; set; }

        [Required(ErrorMessage = "Return date is required.")]
        public DateTime ReturnDate { get; set; }
    }
}
