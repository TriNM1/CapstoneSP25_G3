namespace ToySharingAPI.DTO
{
    public class ListUserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = null!;
        public string? DisplayName { get; set; }
        public bool? Gender { get; set; }
        public int? Status { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
