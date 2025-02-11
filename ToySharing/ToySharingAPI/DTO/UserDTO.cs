namespace ToySharingAPI.DTO
{
    public class UserDTO
    {
        public int UserId { get; set; }

        public string Name { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string Phone { get; set; } = null!;
        public string? Address { get; set; }

        public int? Status { get; set; }

        public string? Avatar { get; set; }

        public double? Rating { get; set; }
    }
}
