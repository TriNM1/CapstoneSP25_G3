namespace ToySharingAPI.DTO
{
    public class RequestDTO
    {
        public int RequestId { get; set; }

        public int UserId { get; set; }

        public int ProductId { get; set; }

        public int? Status { get; set; }

        public DateTime? RequestDate { get; set; }
    }
}
