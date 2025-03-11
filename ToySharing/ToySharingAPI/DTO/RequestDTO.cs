namespace ToySharingAPI.DTO
{
    public class RequestDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public string Message { get; set; }
        public int Status { get; set; } 
        public DateTime? RequestDate { get; set; }
        public DateTime? RentDate { get; set; }
        public DateTime? ReturnDate { get; set; }
    }

    public class HistoryDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Status { get; set; } 
        public int? Rating { get; set; } 
        public DateTime ReturnDate { get; set; } 
    }

    public class BorrowHistoryDTO
    {
        public int RequestId { get; set; }
        public int BorrowerId { get; set; }
        public int ProductId { get; set; }
        public string RequestStatus { get; set; }
        public string HistoryStatus { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? RentDate { get; set; }
        public DateTime? ReturnDate { get; set; }
        public int? Rating { get; set; }
    }
}