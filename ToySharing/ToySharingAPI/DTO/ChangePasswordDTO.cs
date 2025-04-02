using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class ChangePasswordDTO
    {
        [Required(ErrorMessage = "Email is required, please enter email.")]
        [EmailAddress(ErrorMessage = "Invalid email format, please re-enter.")]
        public string Email { get; set; }
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string OldPassword { get; set; }
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string NewPassword { get; set; }
    }
}
