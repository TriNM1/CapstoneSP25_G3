namespace ToySharingAPI.DTO
{
    public class RequestDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; } // Người mượn (người tạo request)
        public string? BorrowerName { get; set; } // Tên người mượn
        public string? BorrowerAvatar { get; set; } // Avatar người mượn
        public int ProductId { get; set; }
        public string? ProductName { get; set; } // Tên sản phẩm
        public decimal Price { get; set; } // Giá sản phẩm
        public int OwnerId { get; set; } // ID của chủ sở hữu (lấy từ Product)
        public string? OwnerName { get; set; } // Tên chủ sở hữu
        public string? Message { get; set; }
        public string? MessageFeedback { get; set; }
        public int Status { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime RentDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public int? Rating { get; set; } // Đánh giá từ History
        public string? Image { get; set; } // Thêm thuộc tính Image
    }

    public class HistoryDTO
    {
        public int RequestId { get; set; }
        public int UserId { get; set; } // Người mượn
        public string? BorrowerName { get; set; } // Tên người mượn
        public int ProductId { get; set; }
        public string? ProductName { get; set; } // Tên sản phẩm
        public int Status { get; set; }
        public int? Rating { get; set; }
        public string? Message { get; set; } // Nội dung báo cáo tự đánh giá (mới thêm)
        public DateTime ReturnDate { get; set; }
        public string? Image { get; set; } // Thêm thuộc tính Image
    }

    public class BorrowHistoryDTO
    {
        public int RequestId { get; set; }
        public int BorrowerId { get; set; }
        public string? BorrowerName { get; set; }
        public string? BorrowerAvatar { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal Price { get; set; } 
        public string? Image { get; set; }
        public string RequestStatus { get; set; } = null!;
        public string? HistoryStatus { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? RentDate { get; set; }
        public DateTime? ReturnDate { get; set; }
        public int? Rating { get; set; }
        public string? Message { get; set; } // Nội dung báo cáo tự đánh giá (mới thêm)

    }

    public class RequestStatusDTO
    {
        public int RequestId { get; set; }
        public int Status { get; set; }
    }

    public class FeedbackDTO
    {
        public int HistoryId { get; set; }
        public int Rating { get; set; }
    }
    public class CompleteRequestDTO
    {
        public int Rating { get; set; }
        public string? Message { get; set; }
    }
}