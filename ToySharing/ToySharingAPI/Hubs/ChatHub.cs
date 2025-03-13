using Microsoft.AspNetCore.SignalR;

namespace ToySharingAPI.Hubs
{
    public class ChatHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }
    }
}
