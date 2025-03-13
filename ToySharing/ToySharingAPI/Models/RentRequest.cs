using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class RentRequest
{
    public int RequestId { get; set; }

    public int UserId { get; set; }

    public int ProductId { get; set; }

    public string? Message { get; set; }

    public int? Status { get; set; }

    public DateTime? RequestDate { get; set; }

    public DateTime RentDate { get; set; }

    public DateTime ReturnDate { get; set; }

    public virtual History? History { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
