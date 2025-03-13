using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class BanLog
{
    public int LogId { get; set; }

    public int UserId { get; set; }

    public DateTime? Timestamp { get; set; }

    public string Reason { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
