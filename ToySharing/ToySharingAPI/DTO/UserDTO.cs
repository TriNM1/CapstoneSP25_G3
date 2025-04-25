namespace ToySharingAPI.DTO
{
    public class UserDTO
    {
        public string Name { get; set; } = string.Empty; // Non-nullable, default empty string
        public string? DisplayName { get; set; } = string.Empty; // Non-nullable, default empty string
        public string? Phone { get; set; } // Nullable
        public string? Address { get; set; } // Nullable
        public int? Status { get; set; } // Non-nullable, default 0
        public string? Avatar { get; set; } // Nullable
        public double Rating { get; set; } // Non-nullable, default 0
        public bool? Gender { get; set; } // Non-nullable, default false
        public int? Age { get; set; } // Non-nullable, default 0
        public string? BankName { get; set; } // Nullable
        public string? BankAccount { get; set; } // Nullable
        public string? BankAccountName { get; set; } // Nullable
        public decimal? Latitude { get; set; } // Nullable
        public decimal? Longitude { get; set; } // Nullable
        public DateTime? CreatedAt { get; set; } // Nullable
    }

    public class UserProfileDTO
    {
        public UserInfo UserInfo { get; set; } = null!;
    }

    public class UserInfo
    {
        public string DisplayName { get; set; } = string.Empty; // Non-nullable, default empty string
        public int? Age { get; set; } // Non-nullable, default 0
        public string? Address { get; set; } // Nullable
        public string? Avatar { get; set; } // Nullable
        public double Rating { get; set; } // Non-nullable, default 0
    }

    public class LocationUpdateDTO
    {
        public string? Address { get; set; } // Nullable
    }
}