namespace ToySharingAPI.DTO
{
    public class BanUnbanRequestDTO
    {
        public int UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
