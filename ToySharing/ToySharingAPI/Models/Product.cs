using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class Product
{
    public int ProductId { get; set; }

    public int UserId { get; set; }

    public int CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public int ProductStatus { get; set; }

    public int SuitableAge { get; set; }

    public decimal Price { get; set; }

    public string? Description { get; set; }

    public int? Available { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public decimal ProductValue { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<History> Histories { get; set; } = new List<History>();

    public virtual ICollection<Image> Images { get; set; } = new List<Image>();

    public virtual ICollection<RentRequest> RentRequests { get; set; } = new List<RentRequest>();

    public virtual User User { get; set; } = null!;
}
