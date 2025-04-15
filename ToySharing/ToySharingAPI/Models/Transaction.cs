using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class Transaction
{
    public int TransactionId { get; set; }

    public int RequestId { get; set; }

    public int TransactionType { get; set; }

    public decimal Amount { get; set; }

    public int? FromUserId { get; set; }

    public int? ToUserId { get; set; }

    public int Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? MomoTransactionId { get; set; }

    public virtual RentRequest Request { get; set; } = null!;
}
