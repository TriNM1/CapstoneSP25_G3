using ToySharingAPI.DTO.MoMo;

namespace ToySharingAPI.Service
{
    public interface IMomoService
    {
        Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(OrderInfoModel model);
        Task<MomoExecuteResponseModel> PaymentExecuteAsync(Dictionary<string, string> queryParams);
    }
}
