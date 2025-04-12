namespace ToySharingAPI.DTO
{
    public class ProductUpdateModelDTO
    {
        public string Name { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public int ProductStatus { get; set; }
        public int SuitableAge { get; set; }
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public IFormFileCollection? Files { get; set; } = default!;
    }
}
