namespace ToySharingAPI.DTO.ChatDTO
{
    public class ConversationSummaryDTO
    {
        public int ConversationId { get; set; }
        public OtherUserDTO OtherUser { get; set; }
        public string LastMessageContent { get; set; }
        public DateTime LastMessageAt { get; set; }
    }
}
