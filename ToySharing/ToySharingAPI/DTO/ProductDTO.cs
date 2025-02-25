namespace ToySharingAPI.DTO
{
    public class ProductDTO
    {
        public int ProductId { get; set; }
        public int? UserId { get; set; }
        public string Name { get; set; } = null!;
        public string? CategoryName { get; set; }
        public int? Available { get; set; }
        public string? Description { get; set; }
        public int? ProductStatus { get; set; }
        public string? Address { get; set; }
        public DateTime? CreatedAt { get; set; }
        public decimal? Price { get; set; }
        public int? SuitableAge { get; set; }
        public string? ImagePath { get; set; }
    }
}