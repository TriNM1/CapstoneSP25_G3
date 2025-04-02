using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class ConfirmOTPRequestDTO
    {
        [Required(ErrorMessage = "Email is required, please enter email.")]
        [EmailAddress(ErrorMessage = "Invalid email format, please re-enter.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Please enter OTP.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must have 6 digits.")]
        public string OTP { get; set; }
    }
}
