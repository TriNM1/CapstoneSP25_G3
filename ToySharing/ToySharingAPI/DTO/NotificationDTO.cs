namespace ToySharingAPI.DTO
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }
        public int? UserId { get; set; }
        public string? Content { get; set; }
        public DateTime? CreatedDate { get; set; }
        public bool? ReadStatus { get; set; }
    }
}
