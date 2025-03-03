﻿using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class History
{
    public int RequestId { get; set; }

    public int? UserId { get; set; }

    public int? ProductId { get; set; }

    public int? Status { get; set; }

    public DateTime? ReturnDate { get; set; }

    public virtual Product? Product { get; set; }

    public virtual RentRequest Request { get; set; } = null!;

    public virtual User? User { get; set; }
}
