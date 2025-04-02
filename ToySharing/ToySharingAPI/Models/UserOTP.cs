namespace ToySharingAPI.Models
{
    public class UserOTP
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string OTP { get; set; }
        public DateTime ExpirationTime { get; set; }
    }
}
