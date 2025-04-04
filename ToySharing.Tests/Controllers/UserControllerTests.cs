using Xunit;
using ToySharingAPI.Controllers;
using ToySharingAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using ToySharingAPI.DTO;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Extensions.Http;
using Moq;
using System.Net.Http;

namespace ToySharing.Tests.Controllers
{
    public class UserControllerTests
    {
        private DbContextOptions<ToySharingVer3Context> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<ToySharingVer3Context>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;
        }

        private async Task<(User, Category, Product, RentRequest, History)> SetupTestData(ToySharingVer3Context context)
        {
            var user = new User
            {
                Name = "Test User",
                AuthUserId = Guid.NewGuid(),
                Status = 1,
                Address = "Test Address",
                Avatar = "test.jpg",
                Gender = true,
                Age = 25,
                Rating = 4.5
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var category = new Category
            {
                CategoryName = "Test Category"
            };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var product = new Product
            {
                Name = "Test Product",
                UserId = user.Id,
                CategoryId = category.CategoryId,
                ProductStatus = 1,
                SuitableAge = 5,
                Price = 10.0m,
                Available = 1
            };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            var rentRequest = new RentRequest
            {
                ProductId = product.ProductId,
                UserId = user.Id,
                Status = 1,
                RentDate = DateTime.Now,
                ReturnDate = DateTime.Now.AddDays(7)
            };
            context.RentRequests.Add(rentRequest);
            await context.SaveChangesAsync();

            var history = new History
            {
                RequestId = rentRequest.RequestId,
                UserId = user.Id,
                ProductId = product.ProductId,
                Status = 2,
                Rating = 5,
                ReturnDate = DateTime.Now.AddDays(7),
                Message = "Great product!"
            };
            context.Histories.Add(history);
            await context.SaveChangesAsync();

            return (user, category, product, rentRequest, history);
        }

        private UserController CreateControllerWithUser(ToySharingVer3Context context, Guid authUserId)
        {
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpClient = new Mock<HttpClient>();
            mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(mockHttpClient.Object);

            var controller = new UserController(context, mockHttpClientFactory.Object);
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, authUserId.ToString()) };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            return controller;
        }

        [Fact]
        public async Task GetUserById_ReturnsUser_WhenUserExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, product, _, history) = await SetupTestData(context);
                var mockHttpClientFactory = new Mock<IHttpClientFactory>();
                var mockHttpClient = new Mock<HttpClient>();
                mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(mockHttpClient.Object);
                var controller = new UserController(context, mockHttpClientFactory.Object);

                // Act
                var result = await controller.GetUserById(user.Id);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var returnedUser = Assert.IsType<UserDTO>(okResult.Value);
                Assert.Equal(user.Name, returnedUser.Name);
                Assert.Equal(user.Address, returnedUser.Address);
                Assert.Equal(user.Status, returnedUser.Status);
                Assert.Equal(user.Avatar, returnedUser.Avatar);
                Assert.Equal(user.Gender, returnedUser.Gender);
                Assert.Equal(user.Age, returnedUser.Age);
                Assert.Equal((double)history.Rating, returnedUser.Rating);
            }
        }

        [Fact]
        public async Task GetUserById_ReturnsNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var mockHttpClientFactory = new Mock<IHttpClientFactory>();
                var mockHttpClient = new Mock<HttpClient>();
                mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(mockHttpClient.Object);
                var controller = new UserController(context, mockHttpClientFactory.Object);

                // Act
                var result = await controller.GetUserById(999);

                // Assert
                Assert.IsType<NotFoundResult>(result.Result);
            }
        }

        [Fact]
        public async Task GetUserProducts_ReturnsUserProducts_WhenUserExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, product, _, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);

                // Act
                var result = await controller.GetUserProducts();

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var products = Assert.IsAssignableFrom<IEnumerable<ProductDTO>>(okResult.Value);
                Assert.Single(products);
                Assert.Equal(product.Name, products.First().Name);
            }
        }

        [Fact]
        public async Task GetOtherUserProfile_ReturnsUserProfile_WhenUserExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, product, _, history) = await SetupTestData(context);
                var mockHttpClientFactory = new Mock<IHttpClientFactory>();
                var mockHttpClient = new Mock<HttpClient>();
                mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(mockHttpClient.Object);
                var controller = new UserController(context, mockHttpClientFactory.Object);

                // Act
                var result = await controller.GetOtherUserProfile(user.Id);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var userProfile = Assert.IsType<UserProfileDTO>(okResult.Value);
                Assert.Equal(user.Name, userProfile.UserInfo.Name);
                Assert.Equal(user.Age, userProfile.UserInfo.Age);
                Assert.Equal(user.Address, userProfile.UserInfo.Address);
                Assert.Equal(user.Avatar, userProfile.UserInfo.Avatar);
                Assert.Equal((double)history.Rating, userProfile.UserInfo.Rating);
            }
        }

        [Fact]
        public async Task UpdateUser_ReturnsOk_WhenUserExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, _, _, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);
                var updatedUser = new UserDTO
                {
                    Name = "Updated Name",
                    Address = "Updated Address",
                    Status = 2,
                    Avatar = "updated.jpg",
                    Gender = false,
                    Age = 30
                };

                // Act
                var result = await controller.UpdateUser(updatedUser);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                var response = JsonSerializer.Deserialize<Dictionary<string, string>>(JsonSerializer.Serialize(okResult.Value));
                Assert.Equal("User updated successfully", response["message"]);
            }
        }

        [Fact]
        public async Task GetUserLocation_ReturnsUserLocation_WhenUserExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, _, _, _) = await SetupTestData(context);
                var mockHttpClientFactory = new Mock<IHttpClientFactory>();
                var mockHttpClient = new Mock<HttpClient>();
                mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(mockHttpClient.Object);
                var controller = new UserController(context, mockHttpClientFactory.Object);

                // Act
                var result = await controller.GetUserLocation(user.Id);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                var location = JsonSerializer.Deserialize<Dictionary<string, string>>(JsonSerializer.Serialize(okResult.Value));
                Assert.Equal(user.Address, location["Address"]);
            }
        }
    }
} 