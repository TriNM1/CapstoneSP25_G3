import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import "./Message.scss";
import userAvatar from "../../../assets/user.png";
import friendAvatar from "../../../assets/toy1.jpg";
import Header from "../../../components/Header";
import { useLocation } from "react-router-dom";

let signalRConnection = null;

const Message = () => {
  const [activeLink, setActiveLink] = useState("message");
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const userId = parseInt(localStorage.getItem("userId") || sessionStorage.getItem("userId"));
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const connectionRef = useRef(null);
  const messagesRef = useRef(null); // Ref để focus vào danh sách tin nhắn
  const location = useLocation(); // Nhận state từ navigate

  // Khởi tạo SignalR
  useEffect(() => {
    if (!token || !userId) {
      console.error("No token or userId available for SignalR connection");
      return;
    }

    if (!signalRConnection) {
      signalRConnection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7128/chatHub", {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 1000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build();
    }

    connectionRef.current = signalRConnection;

    const checkServerReady = async () => {
      try {
        await axios.get("https://localhost:7128/api/Conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return true;
      } catch (error) {
        console.error("Server not ready:", error);
        return false;
      }
    };

    const startConnection = async () => {
      if (signalRConnection.state === signalR.HubConnectionState.Connected) {
        console.log("SignalR already connected, Connection ID:", signalRConnection.connectionId);
        return;
      }
      if (signalRConnection.state === signalR.HubConnectionState.Connecting) {
        console.log("SignalR is connecting, waiting...");
        return;
      }

      let attempts = 0;
      const maxAttempts = 5;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (attempts < maxAttempts) {
        if (signalRConnection.state === signalR.HubConnectionState.Disconnected) {
          try {
            const serverReady = await checkServerReady();
            if (!serverReady) {
              console.log(`Attempt ${attempts + 1}: Server not ready, retrying in 1s...`);
              await delay(1000);
              attempts++;
              continue;
            }

            await signalRConnection.start();
            console.log("SignalR Connected, Connection ID:", signalRConnection.connectionId);
            return;
          } catch (err) {
            console.error("SignalR Connection Error:", err);
            attempts++;
            if (attempts < maxAttempts) {
              console.log(`Attempt ${attempts}: Retrying in ${attempts}s...`);
              await delay(attempts * 1000);
            }
          }
        } else {
          console.log("SignalR already connected or connecting during retry");
          return;
        }
      }
      console.error("Failed to connect to SignalR after maximum attempts");
    };

    const handleReceiveMessage = (conversationId, senderId, content, sentAt, messageId) => {
      console.log("Received message:", { conversationId, senderId, content, sentAt, messageId });
      const newMsg = {
        messageId: messageId || Date.now(),
        conversationId,
        senderId,
        content,
        sentAt,
        isRead: false,
      };

      setMessages((prevMessages) => {
        if (prevMessages.some((msg) => msg.messageId === newMsg.messageId)) {
          return prevMessages;
        }
        return [...prevMessages, newMsg].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      });

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((convo) => {
          if (convo.conversationId === conversationId) {
            return {
              ...convo,
              lastMessageContent: content,
              lastMessageAt: sentAt,
            };
          }
          return convo;
        });
        return updatedConversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    if (!signalRConnection._methods?.["receivemessage"]) {
      signalRConnection.on("ReceiveMessage", handleReceiveMessage);
    }

    startConnection();

    return () => {
      signalRConnection.off("ReceiveMessage", handleReceiveMessage);
    };
  }, [token, userId]);

  // Lấy danh sách cuộc trò chuyện và chọn activeConversation từ state
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get("https://localhost:7128/api/Conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedConversations = response.data.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
        setConversations(sortedConversations);

        // Kiểm tra nếu có activeConversationId từ Header
        const activeConvoId = location.state?.activeConversationId;
        if (activeConvoId) {
          const activeConvo = sortedConversations.find(
            (convo) => convo.conversationId === activeConvoId
          );
          if (activeConvo) {
            setActiveConversation(activeConvo);
          }
        } else if (sortedConversations.length > 0 && !activeConversation) {
          setActiveConversation(sortedConversations[0]); // Mặc định chọn cuộc đầu tiên
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
      }
    };
    fetchConversations();
  }, [token, location.state]);

  // Lấy tin nhắn và focus vào danh sách tin nhắn
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `https://localhost:7128/api/conversations/${activeConversation.conversationId}/messages?page=1&pageSize=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sortedMessages = response.data.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        setMessages(sortedMessages);

        // Focus vào khu vực tin nhắn
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight; // Cuộn xuống dưới cùng
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tin nhắn:", error);
      }
    };
    fetchMessages();
  }, [activeConversation, token]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await axios.post(
        `https://localhost:7128/api/conversations/${activeConversation.conversationId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setMessages((prevMessages) => {
        if (prevMessages.some((msg) => msg.messageId === response.data.messageId)) {
          return prevMessages;
        }
        return [...prevMessages, response.data].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      });

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((convo) => {
          if (convo.conversationId === activeConversation.conversationId) {
            return {
              ...convo,
              lastMessageContent: response.data.content,
              lastMessageAt: response.data.sentAt,
            };
          }
          return convo;
        });
        return updatedConversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });

      setNewMessage("");
      // Cuộn xuống dưới sau khi gửi tin nhắn
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
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
        unreadMessages={conversations.reduce(
          (count, convo) =>
            count + (convo.lastMessageContent && !convo.isRead && convo.lastSenderId !== userId ? 1 : 0),
          0
        )} // Cập nhật động số tin nhắn chưa đọc
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
              <div className="chat-messages" ref={messagesRef}>
                {messages
                  .filter((message) => message.conversationId === activeConversation.conversationId)
                  .map((message) => {
                    const isMe = message.senderId === userId;
                    // console.log("userId:", userId, "senderId:", message.senderId, "isMe:", isMe);
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