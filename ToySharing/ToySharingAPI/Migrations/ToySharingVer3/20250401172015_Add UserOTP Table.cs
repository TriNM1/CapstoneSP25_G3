using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ToySharingAPI.Migrations.ToySharingVer3
{
    /// <inheritdoc />
    public partial class AddUserOTPTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    category_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Categori__D54EE9B4E1D8832D", x => x.category_id);
                });

            migrationBuilder.CreateTable(
                name: "UserOTPs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OTP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserOTPs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    auth_user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    latitude = table.Column<decimal>(type: "decimal(9,6)", nullable: true),
                    longtitude = table.Column<decimal>(type: "decimal(9,6)", nullable: true),
                    status = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    avatar = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    gender = table.Column<bool>(type: "bit", nullable: true),
                    age = table.Column<int>(type: "int", nullable: true),
                    rating = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__3213E83F2DC4D3AD", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Ban_Log",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    timestamp = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Ban_Log__9E2397E09AA33CA8", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_BanLog_User",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    conversation_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user1_id = table.Column<int>(type: "int", nullable: false),
                    user2_id = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    lastMessageAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Conversa__311E7E9AB005892A", x => x.conversation_id);
                    table.ForeignKey(
                        name: "FK_Conversation_User1",
                        column: x => x.user1_id,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Conversation_User2",
                        column: x => x.user2_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    notification_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    content = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    read_status = table.Column<bool>(type: "bit", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Notifica__E059842F654D3F58", x => x.notification_id);
                    table.ForeignKey(
                        name: "FK_Notifications_User",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    product_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    category_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    product_status = table.Column<int>(type: "int", nullable: false),
                    suitable_age = table.Column<int>(type: "int", nullable: false),
                    price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    available = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Products__47027DF5BCAD7D15", x => x.product_id);
                    table.ForeignKey(
                        name: "FK_Products_Category",
                        column: x => x.category_id,
                        principalTable: "Categories",
                        principalColumn: "category_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Products_User",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    message_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    conversation_id = table.Column<int>(type: "int", nullable: false),
                    sender_id = table.Column<int>(type: "int", nullable: true),
                    content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    sent_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    isRead = table.Column<bool>(type: "bit", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Messages__0BBF6EE6E0155DC0", x => x.message_id);
                    table.ForeignKey(
                        name: "FK_Messages_Conversation",
                        column: x => x.conversation_id,
                        principalTable: "Conversations",
                        principalColumn: "conversation_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Messages_Sender",
                        column: x => x.sender_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    image_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    path = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    create_time = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Images__DC9AC95579EC9D53", x => x.image_id);
                    table.ForeignKey(
                        name: "FK_Images_Product",
                        column: x => x.product_id,
                        principalTable: "Products",
                        principalColumn: "product_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Rent_requests",
                columns: table => new
                {
                    request_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    message = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    status = table.Column<int>(type: "int", nullable: false),
                    request_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified)),
                    rent_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    return_date = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Rent_req__18D3B90F0D1323CD", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_Request_Product",
                        column: x => x.product_id,
                        principalTable: "Products",
                        principalColumn: "product_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Request_User",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "History",
                columns: table => new
                {
                    request_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    product_id = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<int>(type: "int", nullable: false),
                    rating = table.Column<int>(type: "int", nullable: true),
                    return_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    message = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__History__18D3B90F5F3A342D", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_History_Product",
                        column: x => x.product_id,
                        principalTable: "Products",
                        principalColumn: "product_id");
                    table.ForeignKey(
                        name: "FK_History_Request",
                        column: x => x.request_id,
                        principalTable: "Rent_requests",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ban_Log_user_id",
                table: "Ban_Log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Categori__5189E25599C21C43",
                table: "Categories",
                column: "category_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_user1_id",
                table: "Conversations",
                column: "user1_id");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_user2_id",
                table: "Conversations",
                column: "user2_id");

            migrationBuilder.CreateIndex(
                name: "IX_History_product_id",
                table: "History",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_Images_product_id",
                table: "Images",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_conversation_id",
                table: "Messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_sender_id",
                table: "Messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_category_id",
                table: "Products",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_user_id",
                table: "Products",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Rent_requests_product_id",
                table: "Rent_requests",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_Rent_requests_user_id",
                table: "Rent_requests",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Ban_Log");

            migrationBuilder.DropTable(
                name: "History");

            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "UserOTPs");

            migrationBuilder.DropTable(
                name: "Rent_requests");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
