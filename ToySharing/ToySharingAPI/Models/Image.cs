using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class Image
{
    public int ImageId { get; set; }

    public int? ProductId { get; set; }

    public string? Path { get; set; }

    public DateTime? CreateTime { get; set; }

    public virtual Product? Product { get; set; }
}
