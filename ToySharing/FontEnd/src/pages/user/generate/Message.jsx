import React, { useState } from "react";
import "./Message.scss";
import userAvatar from "../../../assets/user.png";
import friendAvatar from "../../../assets/toy1.jpg";
import Header from "../../../components/Header";

// Dữ liệu danh sách cuộc trò chuyện giả (đã chuyển sang tiếng Việt)
const fakeConversations = [
  {
    id: 1,
    name: "Lan",
    avatar: friendAvatar,
    lastMessage: "Chào bạn, bạn khỏe không?",
  },
  {
    id: 2,
    name: "Bảo",
    avatar: friendAvatar,
    lastMessage: "Hẹn gặp lại vào ngày mai nhé.",
  },
  {
    id: 3,
    name: "Huy",
    avatar: friendAvatar,
    lastMessage: "Nhìn cái hình này kìa!",
  },
];

// Dữ liệu tin nhắn giả cho cuộc trò chuyện đang chọn (đã chuyển sang tiếng Việt)
const fakeMessages = [
  { id: 1, sender: "friend", content: "Chào bạn!", time: "10:00 AM" },
  { id: 2, sender: "me", content: "Chào, bạn khỏe không?", time: "10:01 AM" },
  {
    id: 3,
    sender: "friend",
    content: "Tôi khỏe, cảm ơn. Còn bạn thì sao?",
    time: "10:03 AM",
  },
  { id: 4, sender: "me", content: "Tôi ổn, cảm ơn bạn.", time: "10:05 AM" },
  {
    id: 5,
    sender: "friend",
    content: "Hẹn gặp lại sau nhé.",
    time: "10:07 AM",
  },
];
const Message = () => {
  // Sử dụng hook bên trong component
  const [activeLink, setActiveLink] = useState("message");

  // Khởi tạo cuộc trò chuyện đang chọn (mặc định là cuộc đầu tiên)
  const [activeConversation, setActiveConversation] = useState(
    fakeConversations[0]
  );

  return (
    <>
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />
      <div className="message-page">
        {/* Sidebar danh sách cuộc trò chuyện */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Chats</h2>
          </div>
          <div className="conversation-list">
            {fakeConversations.map((convo) => (
              <div
                key={convo.id}
                className={`conversation-item ${
                  activeConversation.id === convo.id ? "active" : ""
                }`}
                onClick={() => setActiveConversation(convo)}
              >
                <img
                  src={convo.avatar}
                  alt={convo.name}
                  className="conversation-avatar"
                />
                <div className="conversation-info">
                  <h4>{convo.name}</h4>
                  <p>{convo.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Khung chat */}
        <div className="chat-window">
          <div className="chat-header">
            <img
              src={activeConversation.avatar}
              alt={activeConversation.name}
              className="chat-avatar"
            />
            <h3>{activeConversation.name}</h3>
          </div>
          <div className="chat-messages">
            {fakeMessages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.sender === "me" ? "sent" : "received"
                }`}
              >
                <div className="message-content">{message.content}</div>
                <span className="message-time">{message.time}</span>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Nhập tin nhắn..." />
            <button>Gửi</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;
