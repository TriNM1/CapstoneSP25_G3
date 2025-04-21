namespace ToySharingAPI.DTO
{
    public class LoginResponseDTO
    {
        public string JwtToken { get; set; }
        public int UserId { get; set; }
        public bool IsProfileCompleted { get; set; }
        public string Role {  get; set; }
        public int? Status { get; set; }
    }
}
