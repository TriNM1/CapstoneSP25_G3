
namespace ToySharingAPI.DTO.Admin
{
    public class CreateBannerDTO
    {
        public string Title { get; set; }
        public string? LinkUrl { get; set; }
        public int Status { get; set; }
        public int? Priority { get; set; }
        public IFormFile Image { get; set; }
    }
}
