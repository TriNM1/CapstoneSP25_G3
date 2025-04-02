using System;
using System.Collections.Generic;

namespace ToySharingAPI.Models;

public partial class UserOtp
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string Otp { get; set; } = null!;

    public DateTime ExpirationTime { get; set; }
}
