using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class Message
{
    public int MessageId { get; set; }

    public int ConversationId { get; set; }

    public int? SenderId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime? SentAt { get; set; }

    public bool? IsRead { get; set; }

    public virtual Conversation Conversation { get; set; } = null!;

    public virtual User? Sender { get; set; }
}
