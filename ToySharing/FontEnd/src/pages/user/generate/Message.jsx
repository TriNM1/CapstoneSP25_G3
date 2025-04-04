import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr"; // Import SignalR
import "./Message.scss";
import userAvatar from "../../../assets/user.png";
import friendAvatar from "../../../assets/toy1.jpg";
import Header from "../../../components/Header";

const Message = () => {
  const [activeLink, setActiveLink] = useState("message");
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const connectionRef = useRef(null); // Ref để lưu kết nối SignalR

  // Kết nối SignalR khi component mount
  useEffect(() => {
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const token = sessionToken || localToken;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7128/chatHub", {
        accessTokenFactory: () => token, // Gửi token để xác thực
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection
      .start()
      .then(() => console.log("SignalR Connected"))
      .catch((err) => console.error("SignalR Connection Error:", err));

    // Lắng nghe tin nhắn mới
    connection.on("ReceiveMessage", (conversationId, senderId, content, sentAt) => {
      if (activeConversation && conversationId === activeConversation.conversationId) {
        const newMsg = {
          messageId: Date.now(), // Tạm dùng timestamp, backend sẽ cung cấp ID thực
          conversationId,
          senderId,
          content,
          sentAt,
          isRead: false,
        };
        setMessages((prevMessages) => [...prevMessages, newMsg]);
      }
    });

    // Ngắt kết nối khi component unmount
    return () => {
      connection.stop();
    };
  }, [activeConversation]);

  // Lấy danh sách cuộc trò chuyện
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const token = sessionToken || localToken;
        const response = await axios.get("https://localhost:7128/api/Conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setConversations(response.data);
        if (response.data.length > 0) {
          setActiveConversation(response.data[0]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
      }
    };
    fetchConversations();
  }, []);

  // Lấy danh sách tin nhắn
  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        try {
          const localToken = localStorage.getItem("token");
          const sessionToken = sessionStorage.getItem("token");
          const token = sessionToken || localToken;
          const response = await axios.get(
            `https://localhost:7128/api/conversations/${activeConversation.conversationId}/messages?page=1&pageSize=10`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setMessages(response.data.reverse());
        } catch (error) {
          console.error("Lỗi khi lấy danh sách tin nhắn:", error);
        }
      };
      fetchMessages();
    }
  }, [activeConversation]);

  // Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      const response = await axios.post(
        `https://localhost:7128/api/conversations/${activeConversation.conversationId}/messages`,
        { content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((prevMessages) => [...prevMessages, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };

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
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Chats</h2>
          </div>
          <div className="conversation-list">
            {conversations.length > 0 ? (
              conversations.map((convo) => (
                <div
                  key={convo.conversationId}
                  className={`conversation-item ${
                    activeConversation?.conversationId === convo.conversationId ? "active" : ""
                  }`}
                  onClick={() => setActiveConversation(convo)}
                >
                  <img
                    src={convo.otherUser.avatar || userAvatar}
                    alt={convo.otherUser.name}
                    className="conversation-avatar"
                  />
                  <div className="conversation-info">
                    <h4>{convo.otherUser.name}</h4>
                    <p>{convo.lastMessageContent}</p>
                    <span>{new Date(convo.lastMessageAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>Không có cuộc trò chuyện nào.</p>
            )}
          </div>
        </div>

        <div className="chat-window">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <img
                  src={activeConversation.otherUser.avatar || friendAvatar}
                  alt={activeConversation.otherUser.name}
                  className="chat-avatar"
                />
                <h3>{activeConversation.otherUser.name}</h3>
              </div>
              <div className="chat-messages">
                {messages.map((message) => {
                  const isMe = message.senderId === parseInt(userId);
                  return (
                    <div
                      key={message.messageId}
                      className={`chat-message ${isMe ? "sent" : "received"}`}
                    >
                      <div className="message-content">{message.content}</div>
                      <span className="message-time">
                        {new Date(message.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Gửi</button>
              </div>
            </>
          ) : (
            <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Message;