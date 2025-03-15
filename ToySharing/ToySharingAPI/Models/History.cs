using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class History
{
    public int RequestId { get; set; }

    public int UserId { get; set; }

    public int ProductId { get; set; }

    public int Status { get; set; }

    public int? Rating { get; set; }

    public DateTime ReturnDate { get; set; }

    public string? Message { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual RentRequest Request { get; set; } = null!;
}
