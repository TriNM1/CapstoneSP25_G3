namespace ToySharingAPI.DTO
{
    public class ProductDTO
    {
        public int ProductId { get; set; }      
        public string Name { get; set; }
        public string? Tag { get; set; }
        public int Available { get; set; }
        public string? Description { get; set; }
        public int ProductStatus { get; set; }
        public string? Address { get; set; }
        public DateTime? CreatedAt { get; set; } 

    }
}
