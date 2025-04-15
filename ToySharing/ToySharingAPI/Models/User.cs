using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class User
{
    public int Id { get; set; }

    public Guid AuthUserId { get; set; }

    public string Name { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public string? Address { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longtitude { get; set; }

    public int? Status { get; set; }

    public string? Avatar { get; set; }

    public bool? Gender { get; set; }

    public int? Age { get; set; }

    public double? Rating { get; set; }

    public string? Displayname { get; set; }

    public string? Phone { get; set; }

    public string? BankName { get; set; }

    public string? BankAccount { get; set; }

    public string? BankAccountName { get; set; }

    public virtual ICollection<BanLog> BanLogs { get; set; } = new List<BanLog>();

    public virtual ICollection<Conversation> ConversationUser1s { get; set; } = new List<Conversation>();

    public virtual ICollection<Conversation> ConversationUser2s { get; set; } = new List<Conversation>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<RentRequest> RentRequests { get; set; } = new List<RentRequest>();
}
