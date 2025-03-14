-- USE master;
-- ALTER DATABASE ToySharing_ver3 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
-- DROP DATABASE ToySharing_ver3;

CREATE DATABASE ToySharing_ver3;
GO
USE ToySharing_ver3;
GO

-- 1. Bảng Users
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    auth_user_id UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    [address] NVARCHAR(255),
    latitude DECIMAL(9,6),
    longtitude DECIMAL(9,6),
    [status] INT CHECK (status IN (0,1)) DEFAULT 0,
    avatar VARCHAR(255),
    gender BIT,
    age INT,
    rating FLOAT NULL
);

-- Insert dữ liệu mẫu cho Users
INSERT INTO Users (auth_user_id, [name], [address], latitude, longtitude, [status], avatar, gender, age, rating)
VALUES 
    (NEWID(), N'Nguyễn Văn A', N'123 Đường Láng, Hà Nội', 21.0278, 105.8342, 0, 'avatar1.jpg', 1, 30, 4.5),
    (NEWID(), N'Trần Thị B', N'456 Lê Lợi, TP.HCM', 10.7769, 106.7009, 0, 'avatar2.jpg', 0, 25, 4.0),
    (NEWID(), N'Lê Văn C', N'789 Trần Phú, Đà Nẵng', 16.0471, 108.2062, 1, 'avatar3.jpg', 1, 35, 3.8);
GO

-- 2. Bảng Categories
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(50) NOT NULL UNIQUE
);

-- Insert dữ liệu mẫu cho Categories
INSERT INTO Categories (category_name)
VALUES 
    (N'Xe đồ chơi'),
    (N'Búp bê'),
    (N'Xếp hình');
GO

-- 3. Bảng Products
CREATE TABLE Products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    category_id INT NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    product_status INT CHECK (product_status IN (0,1,2)) NOT NULL,
    suitable_age INT NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    [description] NVARCHAR(200),
    available INT CHECK (available IN (0,1,2)) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Products_User FOREIGN KEY ([user_id]) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Products_Category FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho Products
INSERT INTO Products ([user_id], category_id, [name], product_status, suitable_age, price, [description], available)
VALUES 
    (1, 1, N'Xe ô tô điều khiển từ xa', 0, 5, 150000, N'Xe mới, pin sạc đầy đủ', 0),
    (2, 2, N'Búp bê Barbie', 1, 3, 100000, N'Búp bê đẹp, còn tốt', 1),
    (3, 3, N'Lego City 500 mảnh', 2, 7, 200000, N'Bộ xếp hình cũ nhưng đủ mảnh', 0);
GO

-- 4. Bảng Images
CREATE TABLE Images (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    [path] VARCHAR(MAX) NOT NULL,
    create_time DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Images_Product FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho Images
INSERT INTO Images (product_id, [path])
VALUES 
    (1, 'images/xe_oto_1.jpg'),
    (2, 'images/bup_be_1.jpg'),
    (3, 'images/lego_1.jpg');
GO

-- 5. Bảng Rent_requests
CREATE TABLE Rent_requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    product_id INT NOT NULL,
    [message] NVARCHAR(255),
    [status] INT CHECK (status IN (0,1,2)) DEFAULT 0,
    request_date DATETIME DEFAULT GETDATE(),
    rent_date DATETIME NOT NULL,
    return_date DATETIME NOT NULL,
    CONSTRAINT FK_Request_User FOREIGN KEY ([user_id]) REFERENCES Users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_Request_Product FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho Rent_requests
INSERT INTO Rent_requests ([user_id], product_id, [message], [status], rent_date, return_date)
VALUES 
    (2, 1, N'Cho mình mượn xe này nhé!', 1, '2025-03-11', '2025-03-15'),
    (1, 2, N'Mình cần búp bê cho bé chơi', 0, '2025-03-12', '2025-03-16'),
    (3, 1, N'Xe này còn không?', 2, '2025-03-10', '2025-03-14');
GO

-- 6. Bảng History
CREATE TABLE History (
    request_id INT PRIMARY KEY,
    [user_id] INT NOT NULL,
    product_id INT NOT NULL,
    [status] INT CHECK (status IN (0,1,2)) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5) NULL,
    return_date DATETIME NOT NULL,
    CONSTRAINT FK_History_Request FOREIGN KEY (request_id) REFERENCES Rent_requests(request_id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho History
INSERT INTO History (request_id, [user_id], product_id, [status], rating, return_date)
VALUES 
    (1, 2, 1, 1, 4, '2025-03-15');
GO

-- 7. Bảng Ban_Log
CREATE TABLE Ban_Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    [timestamp] DATETIME DEFAULT GETDATE(),
    reason NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_BanLog_User FOREIGN KEY ([user_id]) REFERENCES Users(id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho Ban_Log
INSERT INTO Ban_Log ([user_id], reason)
VALUES 
    (3, N'Vi phạm quy định cộng đồng');
GO

-- 8. Bảng Notifications
CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] INT NOT NULL,
    content NVARCHAR(255) NOT NULL,
    created_date DATETIME DEFAULT GETDATE(),
    read_status BIT DEFAULT 0,
    CONSTRAINT FK_Notifications_User FOREIGN KEY ([user_id]) REFERENCES Users(id) ON DELETE CASCADE
);

-- Insert dữ liệu mẫu cho Notifications
INSERT INTO Notifications ([user_id], content)
VALUES 
    (1, N'Bạn có yêu cầu mượn đồ chơi mới'),
    (2, N'Yêu cầu mượn của bạn đã được chấp nhận');
GO

-- 9. Bảng Conversations
CREATE TABLE Conversations (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    lastMessageAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Conversation_User1 FOREIGN KEY (user1_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Conversation_User2 FOREIGN KEY (user2_id) REFERENCES Users(id) ON DELETE NO ACTION
);

-- Insert dữ liệu mẫu cho Conversations
INSERT INTO Conversations (user1_id, user2_id)
VALUES 
    (1, 2),
    (2, 3);
GO

-- 10. Bảng Messages
CREATE TABLE Messages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NULL,
    content NVARCHAR(1000) NOT NULL,
    sent_at DATETIME DEFAULT GETDATE(),
    isRead BIT DEFAULT 0,
    CONSTRAINT FK_Messages_Conversation FOREIGN KEY (conversation_id) REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_Sender FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE NO ACTION
);

-- Insert dữ liệu mẫu cho Messages
INSERT INTO Messages (conversation_id, sender_id, content)
VALUES 
    (1, 1, N'Chào bạn, xe ô tô còn không?'),
    (1, 2, N'Còn nhé, bạn muốn mượn không?');
GO
