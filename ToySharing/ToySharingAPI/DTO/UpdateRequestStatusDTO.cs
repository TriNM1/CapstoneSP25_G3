﻿using System.ComponentModel.DataAnnotations;

namespace ToySharingAPI.DTO
{
    public class UpdateRequestStatusDTO
    {
        [Required(ErrorMessage = "New status is required.")]
        [Range(1, 2, ErrorMessage = "Status must be 1 (Accepted) or 2 (Rejected).")]
        public int NewStatus { get; set; }
    }
}
