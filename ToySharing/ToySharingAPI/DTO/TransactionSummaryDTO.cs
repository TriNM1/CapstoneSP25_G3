namespace ToySharingAPI.DTO
{
    public class TransactionSummaryDTO
    {
        public int TransactionId { get; set; }
        public string MomoTransactionId { get; set; }
        public int TransactionType { get; set; }
        public decimal Amount { get; set; }
        public string OrderInfo { get; set; }
        public int RequestId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
