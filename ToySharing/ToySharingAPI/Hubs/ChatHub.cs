using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ToySharingAPI.Hubs
{
    public class ChatHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier ?? "Not found";
            Console.WriteLine($"Client connected: {Context.ConnectionId}, User: {userId}");
            return base.OnConnectedAsync();
        }
    }
}
