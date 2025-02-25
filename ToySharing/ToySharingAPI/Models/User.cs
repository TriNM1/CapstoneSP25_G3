using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class User
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Password { get; set; }

    public string? Phone { get; set; }

    public int? Role { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? Address { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longtitude { get; set; }

    public int? Status { get; set; }

    public string? Avatar { get; set; }

    public bool? Gender { get; set; }

    public int? Age { get; set; }

    public double? Rating { get; set; }

    public virtual ICollection<BanLog> BanLogAdmins { get; set; } = new List<BanLog>();

    public virtual ICollection<BanLog> BanLogUsers { get; set; } = new List<BanLog>();

    public virtual ICollection<History> Histories { get; set; } = new List<History>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<RentRequest> RentRequests { get; set; } = new List<RentRequest>();
}
