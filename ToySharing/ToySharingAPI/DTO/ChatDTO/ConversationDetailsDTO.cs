namespace ToySharingAPI.DTO.ChatDTO
{
    public class ConversationDetailsDTO
    {
        public int ConversationId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
        public int User1Id { get; set; }
        public int User2Id { get; set; }
        public List<MessageDTO> Messages { get; set; }
    }

    public class MessageDTO
    {
        public int MessageId { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
