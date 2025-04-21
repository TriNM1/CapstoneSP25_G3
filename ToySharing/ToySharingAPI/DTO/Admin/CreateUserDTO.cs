namespace ToySharingAPI.DTO.Admin
{
    public class CreateUserDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string DisplayName { get; set; }
        public bool Gender { get; set; }
        public string Role { get; set; }
    }
}
