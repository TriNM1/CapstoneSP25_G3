using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using ToySharingAPI.DTO;
using ToySharingAPI.Models;
using ToySharingAPI.Service;

namespace ToySharingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ToySharingVer3Context _context;
        private readonly AwsSettings _awsSettings;
        private readonly IAmazonS3 _s3Client;

        public ProductsController(ToySharingVer3Context context, IOptions<AwsSettings> awsSettings)
        {
            _context = context;
            _awsSettings = awsSettings.Value;
            var credentials = new BasicAWSCredentials(_awsSettings.AccessKey, _awsSettings.SecretKey);
            _s3Client = new AmazonS3Client(credentials, RegionEndpoint.GetBySystemName(_awsSettings.Region));
        }

        // Hàm hỗ trợ lấy mainUserId từ JWT token
        private async Task<int> GetAuthenticatedUserId()
        {
            if (!User.Identity.IsAuthenticated)
                throw new UnauthorizedAccessException("Người dùng chưa đăng nhập.");

            var authUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authUserIdStr))
                throw new UnauthorizedAccessException("Không tìm thấy thông tin xác thực người dùng.");

            if (!Guid.TryParse(authUserIdStr, out Guid authUserId))
                throw new UnauthorizedAccessException("ID người dùng không hợp lệ.");

            var mainUser = await _context.Users.FirstOrDefaultAsync(u => u.AuthUserId == authUserId);
            if (mainUser == null)
                throw new UnauthorizedAccessException("Không tìm thấy người dùng trong hệ thống.");

            return mainUser.Id;
        }
        // Phương thức upload ảnh lên S3
        private async Task<string> UploadImageToS3(IFormFile file)
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var key = $"uploads/{fileName}";
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = file.OpenReadStream(),
                Key = key,
                BucketName = _awsSettings.BucketName,
                ContentType = file.ContentType
            };

            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            return $"https://{_awsSettings.BucketName}.s3.{_awsSettings.Region}.amazonaws.com/{key}";
        }

        // Thêm endpoint để lấy danh sách danh mục
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => c.CategoryName)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPut("{id}/visibility-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleProductVisibility(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            product.Available = (product.Available == 0) ? 2 : 0;
            _context.Entry(product).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product visibility updated.", product });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetAllProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();
            return Ok(products);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetProductsByUserId(int userId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId == userId)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDTO>> GetProductById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.ProductId == id)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .FirstOrDefaultAsync();
            return Ok(product);
        }

        [HttpGet("detail/{productId}")]
        public async Task<ActionResult<object>> GetProductDetail(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.ProductId == productId)
                .Select(p => new
                {
                    ProductId = p.ProductId,
                    ProductName = p.Name,
                    Cost = p.Price,
                    Description = p.Description,
                    ImagePaths = p.Images.Select(i => i.Path).ToList(),
                    RentInfo = _context.RentRequests
                        .Where(r => r.ProductId == p.ProductId && r.Status == 1)
                        .Select(r => new { BorrowDate = r.RentDate, ReturnDate = r.ReturnDate })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            return Ok(product);
        }

        [HttpGet("{id}/owner")]
        public async Task<ActionResult<UserDTO>> GetOwnerProfileByProductId(int id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            var owner = await _context.Users
                .Where(u => u.Id == product.UserId)
                .Select(u => new UserDTO
                {
                    Name = u.Name,
                    Address = u.Address,
                    Status = u.Status,
                    Avatar = u.Avatar,
                    Gender = u.Gender,
                    Age = u.Age,
                    Rating = _context.Histories
                        .Where(h => h.Product.UserId == u.Id && h.Status == 2)
                        .Average(h => (double?)h.Rating) ?? 0,
                    CreatedAt = u.CreatedAt,
                    Latitude = u.Latitude,
                    Longitude = u.Longtitude
                })
                .FirstOrDefaultAsync();

            if (owner == null)
            {
                return NotFound("Owner not found.");
            }

            return Ok(owner);
        }

        // Endpoint tạo sản phẩm mới
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ProductDTO>> CreateProduct([FromForm] ProductCreateModelDTO model)
        {
            var mainUserId = await GetAuthenticatedUserId();

            if (string.IsNullOrWhiteSpace(model.Name))
                return BadRequest("Product name is required.");
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            // Validation cho ProductStatus
            if (model.ProductStatus < 0 || model.ProductStatus > 2)
                return BadRequest("ProductStatus must be 0 (New), 1 (Used), or 2.");
            var imagePaths = new List<string>();
            if (model.Files == null || model.Files.Count == 0)
                return BadRequest("At least one image is required.");

            if (model.Files.Count > 10)
                return BadRequest("Maximum 10 images allowed.");

            foreach (var file in model.Files)
            {
                if (!file.ContentType.StartsWith("image/"))
                    return BadRequest("Only image files are allowed.");
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest("File size exceeds 5MB.");

                var imageUrl = await UploadImageToS3(file);
                imagePaths.Add(imageUrl);
            }

            var product = new Product
            {
                UserId = mainUserId,
                Name = model.Name.Trim(),
                Description = model.Description?.Trim(),
                ProductStatus = model.ProductStatus,
                SuitableAge = model.SuitableAge,
                Price = model.Price,
                ProductValue = model.ProductValue,
                Available = 0,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // Gán ảnh
            product.Images = imagePaths.Select(path => new Image
            {
                Path = path.Trim(),
                CreateTime = DateTime.Now
            }).ToList();

            // Xử lý danh mục
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryName == model.CategoryName);
            if (category == null)
            {
                category = new Category
                {
                    CategoryName = model.CategoryName
                };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
            }
            product.CategoryId = category.CategoryId;

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var productDto = new ProductDTO
            {
                ProductId = product.ProductId,
                UserId = product.UserId,
                Name = product.Name,
                CategoryName = category.CategoryName,
                ProductStatus = product.ProductStatus,
                SuitableAge = product.SuitableAge,
                Price = product.Price,
                ProductValue = product.ProductValue,
                Description = product.Description,
                Available = product.Available ?? 0,
                CreatedAt = product.CreatedAt ?? DateTime.Now,
                ImagePaths = imagePaths
            };

            return CreatedAtAction(nameof(GetProductById), new { id = product.ProductId }, productDto);
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(int id, [FromForm] ProductUpdateModelDTO model)
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == id);
            if (product == null)
                return NotFound("Product not found.");

            if (product.UserId != mainUserId)
                return Forbid("You are not authorized to update this product.");

            // Validate input
            if (string.IsNullOrWhiteSpace(model.Name))
                return BadRequest("Product name is required and cannot be empty or whitespace.");
            if (model.SuitableAge < 0 || model.SuitableAge > 50)
                return BadRequest("Suitable age must be between 0 and 50.");
            if (!string.IsNullOrEmpty(model.Description) && model.Description.Length > 500)
                return BadRequest("Description cannot exceed 500 characters.");


            // Update product details
            product.Name = model.Name.Trim();
            if (!string.IsNullOrWhiteSpace(model.CategoryName))
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.CategoryName == model.CategoryName.Trim());
                if (category == null)
                {
                    category = new Category { CategoryName = model.CategoryName.Trim() };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
                product.CategoryId = category.CategoryId;
            }
            product.Description = model.Description?.Trim();
            product.ProductStatus = model.ProductStatus;
            product.Price = model.Price;
            product.SuitableAge = model.SuitableAge;
            product.UpdatedAt = DateTime.Now;

            // Handle new image uploads
            if (model.Files != null && model.Files.Count > 0)
            {
                if (model.Files.Count > 10)
                    return BadRequest("Maximum 10 images are allowed.");

                var imagePaths = new List<string>();
                foreach (var file in model.Files)
                {
                    if (file.Length > 0)
                    {
                        if (!file.ContentType.StartsWith("image/"))
                            return BadRequest("Only image files are allowed.");
                        if (file.Length > 5 * 1024 * 1024) 
                            return BadRequest("File size exceeds 5MB.");

                        var imageUrl = await UploadImageToS3(file);
                        imagePaths.Add(imageUrl);
                    }
                }

                product.Images.Clear();
                product.Images = imagePaths.Select(path => new Image
                {
                    Path = path.Trim(),
                    CreateTime = DateTime.Now
                }).ToList();
            }

            try
            {
                await _context.SaveChangesAsync();
                var updatedProductDto = new ProductDTO
                {
                    ProductId = product.ProductId,
                    UserId = product.UserId,
                    Name = product.Name,
                    CategoryName = product.Category?.CategoryName,
                    Description = product.Description,
                    ProductStatus = product.ProductStatus,
                    Price = product.Price,
                    SuitableAge = product.SuitableAge,
                    CreatedAt = product.CreatedAt ?? DateTime.Now,
                    ImagePaths = product.Images.Select(i => i.Path).ToList()
                };
                return Ok(updatedProductDto);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, $"Database error occurred: {ex.InnerException?.Message}");
            }
        }

        // Cập nhật endpoint my-toys để thêm borrowCount
        [HttpGet("my-toys")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyToys()
        {
            var mainUserId = await GetAuthenticatedUserId();
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.RentRequests)
                .Where(p => p.UserId == mainUserId)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList(),
                    BorrowCount = p.RentRequests.Count(r => r.Status == 1)
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("my-toys/borrowing")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetMyBorrowingToys()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId == mainUserId && (p.Available ?? 0) == 1)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("borrowed")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetBorrowedToys()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.UserId != mainUserId && (p.Available ?? 0) == 1)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> SearchProducts()
        {
            return await GetAllProducts();
        }
        [HttpGet("recommendations")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> ListToyRecommendations()
        {
            var mainUserId = await GetAuthenticatedUserId();
            if (mainUserId == -1)
                return Unauthorized("Không thể xác thực người dùng.");
            var recommendations = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.User)
                .Where(p => (p.Available ?? 0) == 0 && p.UserId != mainUserId)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    UserId = p.UserId,
                    Name = p.Name,
                    OwnerAvatar = p.User.Avatar,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    Available = p.Available ?? 0,
                    Description = p.Description,
                    ProductStatus = p.ProductStatus,
                    Price = p.Price,
                    SuitableAge = p.SuitableAge,
                    CreatedAt = p.CreatedAt ?? DateTime.Now,
                    ImagePaths = p.Images.Select(i => i.Path).ToList()
                })
                .ToListAsync();

            return Ok(recommendations);
        }
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                // Lấy ID người dùng từ token
                var mainUserId = await GetAuthenticatedUserId();

                // Tìm sản phẩm và bao gồm danh sách RentRequests
                var product = await _context.Products
                    .Include(p => p.RentRequests)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                // Kiểm tra sản phẩm có tồn tại không
                if (product == null)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại." });
                }

                // Kiểm tra quyền sở hữu
                if (product.UserId != mainUserId)
                {
                    return Forbid("Bạn không có quyền xóa sản phẩm này vì bạn không phải là chủ sở hữu.");
                }

                // Kiểm tra xem sản phẩm có đang được cho mượn không
                if (product.RentRequests.Any(r => r.Status == 1))
                {
                    return BadRequest(new { message = "Không thể xóa sản phẩm vì sản phẩm đang được cho mượn." });
                }

                // Xóa sản phẩm
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa sản phẩm thành công." });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi chi tiết hơn (có thể dùng ILogger nếu có)
                Console.WriteLine($"Error deleting product {id}: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau." });
            }
        }
        [HttpDelete("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProductByAdmin(int id)
        {
            try
            {
                // Tìm sản phẩm và bao gồm danh sách RentRequests
                var product = await _context.Products
                    .Include(p => p.RentRequests)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                // Kiểm tra sản phẩm có tồn tại không
                if (product == null)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại." });
                }

                // Kiểm tra xem sản phẩm có đang được cho mượn không
                if (product.RentRequests.Any(r => r.Status == 1))
                {
                    return BadRequest(new { message = "Không thể xóa sản phẩm vì sản phẩm đang được cho mượn." });
                }

                // Xóa sản phẩm
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa sản phẩm thành công." });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi chi tiết hơn (có thể dùng ILogger nếu có)
                Console.WriteLine($"Error deleting product {id}: {ex.Message}, StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau." });
            }
        }
        [HttpPost("upload-image")]
        [Authorize]
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No image uploaded.");
            }

            // Kiểm tra loại file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(image.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Only JPG, JPEG, PNG, and GIF files are allowed.");
            }

            // Kiểm tra kích thước file (giới hạn 5MB)
            if (image.Length > 5 * 1024 * 1024)
            {
                return BadRequest("Image size must be less than 5MB.");
            }

            // Tạo tên file duy nhất
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images", fileName);

            // Lưu file vào thư mục wwwroot/images
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            // Trả về URL của ảnh
            var imageUrl = $"/images/{fileName}";
            return Ok(new { imageUrl });
        }
    }
}