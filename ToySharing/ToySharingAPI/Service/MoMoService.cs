using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using RestSharp;
using System.Security.Cryptography;
using System.Text;
using ToySharingAPI.DTO.MoMo;
using ToySharingAPI.Models;

namespace ToySharingAPI.Service
{
    public class MoMoService : IMomoService
    {
        private readonly IOptions<MomoOptionModel> _options;
        private readonly ILogger<MoMoService> _logger;

        public MoMoService(IOptions<MomoOptionModel> options, ILogger<MoMoService> logger)
        {
            _options = options;
            _logger = logger;
        }

        public async Task<MomoCreatePaymentResponseModel> CreatePaymentAsync(OrderInfoModel model)
        {
            try
            {
                // Tạo OrderId theo timestamp và cập nhật OrderInfo
                model.OrderId = DateTime.Now.Ticks.ToString();
                model.OrderInfo = "Khách hàng: " + model.Name + ". Nội dung: " + model.OrderInfo;

                var rawData =
                    $"partnerCode={_options.Value.PartnerCode}&accessKey={_options.Value.AccessKey}&requestId={model.OrderId}&amount={model.Amount}&orderId={model.OrderId}&orderInfo={model.OrderInfo}&returnUrl={_options.Value.ReturnUrl}&notifyUrl={_options.Value.NotifyUrl}&extraData=";

                var signature = ComputeHmacSha256(rawData, _options.Value.SecretKey);

                var client = new RestClient(_options.Value.MomoApiUrl);
                var request = new RestRequest() { Method = Method.Post };
                request.AddHeader("Content-Type", "application/json; charset=UTF-8");

                var requestData = new
                {
                    accessKey = _options.Value.AccessKey,
                    partnerCode = _options.Value.PartnerCode,
                    requestType = _options.Value.RequestType,
                    notifyUrl = _options.Value.NotifyUrl,
                    returnUrl = _options.Value.ReturnUrl,
                    orderId = model.OrderId,
                    amount = model.Amount.ToString(),
                    orderInfo = model.OrderInfo,
                    requestId = model.OrderId,
                    extraData = "",
                    signature = signature
                };

                request.AddParameter("application/json", JsonConvert.SerializeObject(requestData), ParameterType.RequestBody);

                var response = await client.ExecuteAsync(request);
                _logger.LogInformation("MoMo response: {Response}", response.Content);

                return JsonConvert.DeserializeObject<MomoCreatePaymentResponseModel>(response.Content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                throw;
            }
        }

        public async Task<MomoExecuteResponseModel> PaymentExecuteAsync(Dictionary<string, string> queryParams)
        {
            queryParams.TryGetValue("amount", out string amount);
            queryParams.TryGetValue("orderInfo", out string orderInfo);
            queryParams.TryGetValue("orderId", out string orderId);
            var resultCodeStr = queryParams.GetValueOrDefault("errorCode") ?? queryParams.GetValueOrDefault("resultCode");
            var message = queryParams.GetValueOrDefault("message");

            var response = new MomoExecuteResponseModel
            {
                Amount = amount,
                OrderId = orderId,
                OrderInfo = orderInfo,
                ResultCode = int.TryParse(resultCodeStr, out var code) ? code : -1,
                Message = message
            };
            _logger.LogInformation("MomoExecuteResponse: OrderId={OrderId}, ResultCode={ResultCode}, Message={Message}, Amount={Amount}",
            response.OrderId, response.ResultCode, response.Message, response.Amount);
            return response;
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            using (var hmac = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }
    }
}
