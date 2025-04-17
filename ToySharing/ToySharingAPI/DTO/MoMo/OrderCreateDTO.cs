namespace ToySharingAPI.DTO.MoMo
{
    public class OrderCreateDTO
    {
        //public int BorrowerId { get; set; } 
        public int RequestId { get; set; } 
        public decimal DepositAmount { get; set; } 
        public decimal RentalFee { get; set; } 
        public string Name { get; set; } 
        public string OrderInfo { get; set; } 
    }
}
