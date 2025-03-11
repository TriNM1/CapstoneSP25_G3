namespace ToySharingAPI.DTO
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public int? Status { get; set; }
        public string Avatar { get; set; }
        public float Rating { get; set; }
        public bool? Gender { get; set; }
        public int? Age { get; set; }
        public DateTime? CreatedAt { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }

    public class UserProfileDTO
    {
        public UserInfo UserInfo { get; set; }
    }

    public class UserInfo
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public string Address { get; set; }
        public string Avatar { get; set; }
        public float Rating { get; set; } 
    }
}