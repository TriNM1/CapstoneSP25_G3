using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ToySharingAPI.Models;

public partial class ToySharingVer3Context : DbContext
{
    public ToySharingVer3Context()
    {
    }

    public ToySharingVer3Context(DbContextOptions<ToySharingVer3Context> options)
        : base(options)
    {
    }

    public virtual DbSet<BanLog> BanLogs { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Conversation> Conversations { get; set; }

    public virtual DbSet<History> Histories { get; set; }

    public virtual DbSet<Image> Images { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<RentRequest> RentRequests { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserOtp> UserOtps { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        var builder = new ConfigurationBuilder()
                      .SetBasePath(Directory.GetCurrentDirectory())
                      .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
        IConfigurationRoot configuration = builder.Build();
        optionsBuilder.UseSqlServer(configuration.GetConnectionString("MyCnn"));
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BanLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__Ban_Log__9E2397E0A73D62E6");

            entity.ToTable("Ban_Log");

            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.Reason)
                .HasMaxLength(255)
                .HasColumnName("reason");
            entity.Property(e => e.Timestamp)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("timestamp");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.BanLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_BanLog_User");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__D54EE9B409E131A3");

            entity.HasIndex(e => e.CategoryName, "UQ__Categori__5189E255599763CB").IsUnique();

            entity.HasIndex(e => e.CategoryName, "UQ__Categori__5189E255B73F3797").IsUnique();

            entity.HasIndex(e => e.CategoryName, "UQ__Categori__5189E255E64A43EB").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .HasColumnName("category_name");
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.ConversationId).HasName("PK__Conversa__311E7E9A60EAFCF3");

            entity.Property(e => e.ConversationId).HasColumnName("conversation_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.LastMessageAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("lastMessageAt");
            entity.Property(e => e.User1Id).HasColumnName("user1_id");
            entity.Property(e => e.User2Id).HasColumnName("user2_id");

            entity.HasOne(d => d.User1).WithMany(p => p.ConversationUser1s)
                .HasForeignKey(d => d.User1Id)
                .HasConstraintName("FK_Conversation_User1");

            entity.HasOne(d => d.User2).WithMany(p => p.ConversationUser2s)
                .HasForeignKey(d => d.User2Id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Conversation_User2");
        });

        modelBuilder.Entity<History>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__History__18D3B90F3D4D10AE");

            entity.ToTable("History");

            entity.Property(e => e.RequestId)
                .ValueGeneratedNever()
                .HasColumnName("request_id");
            entity.Property(e => e.Message)
                .HasMaxLength(255)
                .HasColumnName("message");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.ReturnDate)
                .HasColumnType("datetime")
                .HasColumnName("return_date");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Product).WithMany(p => p.Histories)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_History_Product");

            entity.HasOne(d => d.Request).WithOne(p => p.History)
                .HasForeignKey<History>(d => d.RequestId)
                .HasConstraintName("FK_History_Request");
        });

        modelBuilder.Entity<Image>(entity =>
        {
            entity.HasKey(e => e.ImageId).HasName("PK__Images__DC9AC955E5CC909D");

            entity.Property(e => e.ImageId).HasColumnName("image_id");
            entity.Property(e => e.CreateTime)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("create_time");
            entity.Property(e => e.Path)
                .IsUnicode(false)
                .HasColumnName("path");
            entity.Property(e => e.ProductId).HasColumnName("product_id");

            entity.HasOne(d => d.Product).WithMany(p => p.Images)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_Images_Product");
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.MessageId).HasName("PK__Messages__0BBF6EE64E34EE25");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Content)
                .HasMaxLength(1000)
                .HasColumnName("content");
            entity.Property(e => e.ConversationId).HasColumnName("conversation_id");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("isRead");
            entity.Property(e => e.SenderId).HasColumnName("sender_id");
            entity.Property(e => e.SentAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("sent_at");

            entity.HasOne(d => d.Conversation).WithMany(p => p.Messages)
                .HasForeignKey(d => d.ConversationId)
                .HasConstraintName("FK_Messages_Conversation");

            entity.HasOne(d => d.Sender).WithMany(p => p.Messages)
                .HasForeignKey(d => d.SenderId)
                .HasConstraintName("FK_Messages_Sender");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__Notifica__E059842F03749662");

            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.Content)
                .HasMaxLength(255)
                .HasColumnName("content");
            entity.Property(e => e.CreatedDate)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("created_date");
            entity.Property(e => e.ReadStatus)
                .HasDefaultValue(false)
                .HasColumnName("read_status");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Notifications_User");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__47027DF5D63307D3");

            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Available)
                .HasDefaultValue(0)
                .HasColumnName("available");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price");
            entity.Property(e => e.ProductStatus).HasColumnName("product_status");
            entity.Property(e => e.SuitableAge).HasColumnName("suitable_age");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_Products_Category");

            entity.HasOne(d => d.User).WithMany(p => p.Products)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Products_User");
        });

        modelBuilder.Entity<RentRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__Rent_req__18D3B90F3D68D6B5");

            entity.ToTable("Rent_requests");

            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.Message)
                .HasMaxLength(255)
                .HasColumnName("message");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.RentDate)
                .HasColumnType("datetime")
                .HasColumnName("rent_date");
            entity.Property(e => e.RequestDate)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("request_date");
            entity.Property(e => e.ReturnDate)
                .HasColumnType("datetime")
                .HasColumnName("return_date");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Product).WithMany(p => p.RentRequests)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_Request_Product");

            entity.HasOne(d => d.User).WithMany(p => p.RentRequests)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Request_User");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3213E83F034A81B7");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.AuthUserId).HasColumnName("auth_user_id");
            entity.Property(e => e.Avatar)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("avatar");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValue(new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DisplayName)
                .HasMaxLength(50)
                .HasColumnName("displayName");
            entity.Property(e => e.Gender).HasColumnName("gender");
            entity.Property(e => e.Latitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("latitude");
            entity.Property(e => e.Longtitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("longtitude");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.Status)
                .HasDefaultValue(0)
                .HasColumnName("status");
        });

        modelBuilder.Entity<UserOtp>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserOTP__3214EC076BEA5BC9");

            entity.ToTable("UserOTP");

            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.ExpirationTime).HasColumnType("datetime");
            entity.Property(e => e.Otp)
                .HasMaxLength(10)
                .HasColumnName("OTP");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
