using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class CompleteRequestDTO
    {
        public int? Rating { get; set; }
        public string? Message { get; set; }
    }
}
