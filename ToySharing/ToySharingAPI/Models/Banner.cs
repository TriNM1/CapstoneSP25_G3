using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class Banner
{
    public int BannerId { get; set; }

    public string Title { get; set; } = null!;

    public string ImageUrl { get; set; } = null!;

    public string? LinkUrl { get; set; }

    public int Status { get; set; }

    public int? Priority { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
