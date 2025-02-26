using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class BanLog
{
    public int LogId { get; set; }

    public int? AdminId { get; set; }

    public int? UserId { get; set; }

    public DateTime? Timestamp { get; set; }

    public string? Reasons { get; set; }

    public virtual User? Admin { get; set; }

    public virtual User? User { get; set; }
}
