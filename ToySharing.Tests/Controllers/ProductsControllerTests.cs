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
using System.Text.Json.Serialization;

namespace ToySharing.Tests.Controllers
{
    public class ProductsControllerTests
    {
        private class ProductDetailResponse
        {
            public int ProductId { get; set; }
            public string ProductName { get; set; }
            public decimal Cost { get; set; }
            public string Description { get; set; }
            public List<string> Images { get; set; }
            public RentInfoResponse RentInfo { get; set; }
        }

        private class RentInfoResponse
        {
            public DateTime BorrowDate { get; set; }
            public DateTime ReturnDate { get; set; }
        }

        private class ToggleVisibilityResponse
        {
            public string message { get; set; }
            public Product product { get; set; }
        }

        private DbContextOptions<ToySharingVer3Context> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<ToySharingVer3Context>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;
        }

        private async Task<(User, Category, Product, RentRequest)> SetupTestData(ToySharingVer3Context context)
        {
            var user = new User
            {
                Name = "Test User",
                AuthUserId = Guid.NewGuid(),
                Status = 1
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
                Available = 0
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

            return (user, category, product, rentRequest);
        }

        private ProductsController CreateControllerWithUser(ToySharingVer3Context context, Guid authUserId)
        {
            var controller = new ProductsController(context);
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
        public async Task GetAllProducts_ReturnsAllProducts()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, product, _) = await SetupTestData(context);

                // Act
                var controller = new ProductsController(context);
                var result = await controller.GetAllProducts();

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var products = Assert.IsAssignableFrom<IEnumerable<ProductDTO>>(okResult.Value);
                Assert.Single(products);
                Assert.Equal(product.Name, products.First().Name);
            }
        }

        [Fact]
        public async Task GetProductById_ReturnsProduct_WhenProductExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, product, _) = await SetupTestData(context);

                // Act
                var controller = new ProductsController(context);
                var result = await controller.GetProductById(product.ProductId);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var returnedProduct = Assert.IsType<ProductDTO>(okResult.Value);
                Assert.Equal(product.Name, returnedProduct.Name);
            }
        }

        [Fact]
        public async Task GetProductById_ReturnsNotFound_WhenProductDoesNotExist()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var controller = new ProductsController(context);

                // Act
                var result = await controller.GetProductById(999);

                // Assert
                Assert.IsType<NotFoundResult>(result.Result);
            }
        }

        [Fact]
        public async Task GetProductDetail_ReturnsProductWithRentInfo()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, product, rentRequest) = await SetupTestData(context);

                // Act
                var controller = new ProductsController(context);
                var result = await controller.GetProductDetail(product.ProductId);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var response = JsonSerializer.Deserialize<ProductDetailResponse>(
                    JsonSerializer.Serialize(okResult.Value),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                Assert.Equal(product.Name, response.ProductName);
                Assert.Equal(product.Price, response.Cost);
                Assert.NotNull(response.RentInfo);
                Assert.Equal(rentRequest.RentDate, response.RentInfo.BorrowDate);
                Assert.Equal(rentRequest.ReturnDate, response.RentInfo.ReturnDate);
            }
        }

        [Fact]
        public async Task GetOwnerProfile_ReturnsOwnerWithRating()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, product, rentRequest) = await SetupTestData(context);
                var history = new History
                {
                    ProductId = product.ProductId,
                    UserId = user.Id,
                    RequestId = rentRequest.RequestId,
                    Status = 2,
                    Rating = 5
                };
                context.Histories.Add(history);
                await context.SaveChangesAsync();

                // Act
                var controller = new ProductsController(context);
                var result = await controller.GetOwnerProfileByProductId(product.ProductId);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result.Result);
                var owner = Assert.IsType<UserDTO>(okResult.Value);
                Assert.Equal(user.Name, owner.Name);
                Assert.Equal(5, owner.Rating);
            }
        }

        [Fact]
        public async Task CreateProduct_ReturnsCreatedProduct()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, _, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);
                var productDto = new ProductDTO
                {
                    Name = "New Product",
                    ProductStatus = 1,
                    SuitableAge = 5,
                    Price = 15.0m,
                    Description = "Test Description",
                    Available = 1
                };

                // Act
                var result = await controller.CreateProduct(productDto);

                // Assert
                var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
                var createdProduct = Assert.IsType<ProductDTO>(createdAtResult.Value);
                Assert.Equal("New Product", createdProduct.Name);
                Assert.Equal(15.0m, createdProduct.Price);
            }
        }

        [Fact]
        public async Task CreateProduct_ReturnsBadRequest_WhenDataIsInvalid()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, _, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);
                var invalidProductDto = new ProductDTO();

                // Act
                var result = await controller.CreateProduct(invalidProductDto);

                // Assert
                Assert.IsType<BadRequestObjectResult>(result.Result);
            }
        }

        [Fact]
        public async Task ToggleProductVisibility_ReturnsOk_WhenProductExists()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, category, product, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);

                // Act
                var result = await controller.ToggleProductVisibility(product.ProductId);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                var jsonOptions = new JsonSerializerOptions
                {
                    ReferenceHandler = ReferenceHandler.Preserve,
                    PropertyNameCaseInsensitive = true
                };
                var response = JsonSerializer.Deserialize<ToggleVisibilityResponse>(
                    JsonSerializer.Serialize(okResult.Value, jsonOptions),
                    jsonOptions
                );
                Assert.Equal("Product visibility updated.", response.message);
                Assert.Equal(2, response.product.Available);
            }
        }

        [Fact]
        public async Task ToggleProductVisibility_ReturnsNotFound_WhenProductDoesNotExist()
        {
            // Arrange
            var options = CreateNewContextOptions();
            using (var context = new ToySharingVer3Context(options))
            {
                var (user, _, _, _) = await SetupTestData(context);
                var controller = CreateControllerWithUser(context, user.AuthUserId);

                // Act
                var result = await controller.ToggleProductVisibility(999);

                // Assert
                Assert.IsType<NotFoundObjectResult>(result);
            }
        }
    }
} 