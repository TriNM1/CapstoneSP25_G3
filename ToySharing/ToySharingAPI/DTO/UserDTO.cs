namespace ToySharingAPI.DTO
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int? Role { get; set; }
        public DateTime? CreatedAt { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? Status { get; set; }
        public string? Avatar { get; set; }
        public bool? Gender { get; set; }
        public int? Age { get; set; }
        public double? Rating { get; set; }

        public UserProfileDTO? UserProfile { get; set; }
    }

    public class UserProfileDTO
    {
        public UserInfo UserInfo { get; set; }
        public List<ProductDTO> ToyListOfUser { get; set; }
    }

    public class UserInfo
    {
        public string Name { get; set; }
        public int Age { get; set; } 
        public string Address { get; set; } 
        public string Avatar { get; set; } 
    }
}