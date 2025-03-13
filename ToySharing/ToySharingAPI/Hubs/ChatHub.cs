using Microsoft.AspNetCore.SignalR;

namespace ToySharingAPI.Hubs
{
    public class ChatHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            // Ví dụ: sử dụng thông tin từ token (User.Identity) để ánh xạ connection
            return base.OnConnectedAsync();
        }
    }
}
