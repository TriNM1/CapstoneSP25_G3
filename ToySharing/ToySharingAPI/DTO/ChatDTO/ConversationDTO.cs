namespace ToySharingAPI.DTO.ChatDTO
{
    public class ConversationDTO
    {
        public int ConversationId { get; set; }
        public int User1Id { get; set; }
        public int User2Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
    }
}
