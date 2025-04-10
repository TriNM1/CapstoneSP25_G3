﻿namespace ToySharingAPI.DTO
{
    public class UserDTO
    {
        public string Name { get; set; } = null!; // Không nullable, khớp với User.Name
        public string? DisplayName { get; set; } = null!; //  nullable, khớp với User.Name
        public string? Phone { get; set; } = null!; //  nullable, khớp với User.Name
        public string? Address { get; set; } // Nullable, khớp với User.Address
        public int? Status { get; set; } // Nullable, khớp với User.Status
        public string? Avatar { get; set; } // Nullable, khớp với User.Avatar
        public double Rating { get; set; } // Không nullable, mặc định 0 nếu null, khớp với User.Rating
        public bool? Gender { get; set; } // Nullable, khớp với User.Gender
        public int? Age { get; set; } // Nullable, khớp với User.Age
        public DateTime? CreatedAt { get; set; } // Nullable, khớp với User.CreatedAt
        public decimal? Latitude { get; set; } // Nullable, khớp với User.Latitude
        public decimal? Longitude { get; set; } // Nullable, khớp với User.Longtitude
    }

    public class UserProfileDTO
    {
        public UserInfo UserInfo { get; set; } = null!;
    }

    public class UserInfo
    {
        public string DisplayName { get; set; } // Thay Name bằng DisplayName
        public int Age { get; set; } // Không nullable, mặc định 0 nếu null
        public string? Address { get; set; }
        public string? Avatar { get; set; }
        public double Rating { get; set; } // Không nullable, mặc định 0 nếu null
    }
    public class LocationUpdateDTO
    {
        public string? Address { get; set; }
    }
}