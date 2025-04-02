using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class OTPRequestDTO
    {
        [Required(ErrorMessage = "Email is required, please enter email.")]
        [EmailAddress(ErrorMessage = "Invalid email format, please re-enter.")]
        public string Email { get; set; }
    }
}
