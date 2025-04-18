/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Container, Navbar, Nav, Badge, Dropdown } from "react-bootstrap";
import { FaEnvelope, FaBell } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import logo from "../assets/logo.png";
import user from "../assets/user.png";
import "./Header.scss";

const Header = ({
  activeLink,
  setActiveLink,
  isLoggedIn,
  unreadMessages: initialUnreadMessages,
  notificationCount: initialNotificationCount,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount || 0);
  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages || 0);
  const [userAvatar, setUserAvatar] = useState(user);
  const [connection, setConnection] = useState(null);
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  // Khởi tạo kết nối SignalR
  useEffect(() => {
    if (!isLoggedIn || !token || !userId) {
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7128/chatHub", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [isLoggedIn, token, userId]);

  // Lấy tên người gửi từ senderId
  const fetchSenderName = async (senderId) => {
    if (!senderId || isNaN(senderId)) {
      console.warn("senderId không hợp lệ:", senderId);
      return "Unknown";
    }
    try {
      const response = await axios.get(`https://localhost:7128/api/User/profile/${senderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = response.data.userInfo || response.data;
      return userInfo.displayName || "Unknown";
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin người gửi (ID: ${senderId}):`, error);
      return "Unknown";
    }
  };

  // Bắt đầu kết nối SignalR và lắng nghe sự kiện
  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("SignalR Connected");

          // Lắng nghe sự kiện receivemessage (viết thường để khớp với server)
          connection.on("receivemessage", async (message) => {
            console.log("Tin nhắn mới (receivemessage):", message);

            // Kiểm tra kiểu dữ liệu của message
            if (typeof message !== "object" || message === null) {
              console.warn("Payload không phải object:", message);
              return;
            }

            const { conversationId, senderId, content } = message;

            // Kiểm tra dữ liệu hợp lệ
            if (!conversationId || !content) {
              console.warn("Dữ liệu tin nhắn không đầy đủ:", message);
              return;
            }

            // Chỉ xử lý nếu người gửi không phải người dùng hiện tại
            if (senderId !== parseInt(userId)) {
              // Lấy tên người gửi
              const senderName = await fetchSenderName(senderId);

              setConversations((prev) => {
                const existingConvo = prev.find((convo) => convo.conversationId === conversationId);
                if (existingConvo) {
                  // Cập nhật cuộc trò chuyện hiện có
                  return prev.map((convo) =>
                    convo.conversationId === conversationId
                      ? {
                          ...convo,
                          lastMessageContent: content,
                          isRead: false,
                          lastSenderId: senderId,
                        }
                      : convo
                  );
                } else {
                  // Thêm cuộc trò chuyện mới
                  return [
                    ...prev,
                    {
                      conversationId,
                      lastMessageContent: content,
                      isRead: false,
                      lastSenderId: senderId,
                      otherUser: { name: senderName },
                    },
                  ];
                }
              });

              // Tăng số tin nhắn chưa đọc
              setUnreadMessages((prev) => prev + 1);
            }
          });

          // Thêm sự kiện khác nếu server gửi số lượng tin nhắn chưa đọc
          connection.on("updateUnreadCount", (count) => {
            console.log("Cập nhật số tin nhắn chưa đọc:", count);
            if (typeof count === "number") {
              setUnreadMessages(count);
            }
          });
        })
        .catch((error) => {
          console.error("Lỗi khi kết nối SignalR:", error);
        });

      return () => {
        connection.off("receivemessage");
        connection.off("updateUnreadCount");
        connection.stop();
      };
    }
  }, [connection, userId, token]);

  // Cập nhật activeLink dựa trên đường dẫn
  useEffect(() => {
    const path = location.pathname;
    if (path === "/home") {
      setActiveLink("home");
    } else if (
      path === "/mytoy" ||
      path === "/inlending" ||
      path === "/listborrowrequests" ||
      path === "/transferhistory" ||
      path === "/addtoy"
    ) {
      setActiveLink("Lender");
    } else if (path === "/searchtoy" || path === "/sendingrequest" || path === "/borrowhistory") {
      setActiveLink("Borrow");
    } else if (path === "/policy") {
      setActiveLink("policy");
    } else if (path === "/userguide") {
      setActiveLink("userguide");
    }
  }, [location.pathname, setActiveLink]);

  // Lấy thông báo
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isLoggedIn || !token) {
        setNotifications([]);
        setNotificationCount(0);
        return;
      }
      try {
        const response = await axios.get("https://localhost:7128/api/Notifications/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notificationsData = response.data || [];
        setNotifications(notificationsData);
        setNotificationCount(notificationsData.filter((notif) => !notif.readStatus).length);
      } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        setNotifications([]);
        setNotificationCount(0);
      }
    };
    fetchNotifications();
  }, [isLoggedIn, token]);

  // Lấy danh sách cuộc trò chuyện
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isLoggedIn || !token) {
        setConversations([]);
        setUnreadMessages(0);
        return;
      }
      try {
        const response = await axios.get("https://localhost:7128/api/Conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const conversationsData = response.data || [];
        setConversations(conversationsData);
        const unreadCount = conversationsData.reduce((count, convo) => {
          return (
            count +
            (convo.lastMessageContent && !convo.isRead && convo.lastSenderId !== parseInt(userId) ? 1 : 0)
          );
        }, 0);
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách cuộc trò chuyện:", error);
        setConversations([]);
        setUnreadMessages(0);
      }
    };
    fetchConversations();
  }, [isLoggedIn, token, userId]);

  // Lấy thông tin người dùng
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn || !token || !userId) {
        setUserAvatar(user);
        return;
      }
      try {
        const response = await axios.get(`https://localhost:7128/api/User/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const avatarUrl = response.data.userInfo.avatar;
        setUserAvatar(avatarUrl || user);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        setUserAvatar(user);
      }
    };
    fetchUserProfile();
  }, [isLoggedIn, token, userId]);

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `https://localhost:7128/api/Notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === notificationId ? { ...notif, readStatus: true } : notif
        )
      );
      setNotificationCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
    }
  };

  const handleMarkMessagesAsRead = async (conversationId) => {
    try {
      const response = await axios.get(
        `https://localhost:7128/api/conversations/${conversationId}/messages?page=1&pageSize=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const messages = response.data;
      const unreadMessages = messages.filter((msg) => !msg.isRead && msg.senderId !== parseInt(userId));
      await Promise.all(
        unreadMessages.map((msg) =>
          axios.put(
            `https://localhost:7128/api/conversations/${conversationId}/messages/${msg.messageId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setConversations((prev) =>
        prev.map((convo) =>
          convo.conversationId === conversationId ? { ...convo, isRead: true } : convo
        )
      );
      setUnreadMessages((prev) => Math.max(prev - unreadMessages.length, 0));
      navigate("/message", { state: { activeConversationId: conversationId } });
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="main-navbar">
      <Container>
        <Navbar.Brand
          as={Link}
          to="/home"
          onClick={() => setActiveLink("home")}
          className={activeLink === "home" ? "active" : ""}
        >
          <img src={logo} alt="Logo" className="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/home"
              onClick={() => setActiveLink("home")}
              className={activeLink === "home" ? "active" : ""}
            >
              Trang chủ
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/mytoy"
              onClick={() => setActiveLink("Lender")}
              className={activeLink === "Lender" ? "active" : ""}
            >
              Cho mượn đồ
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/searchtoy"
              onClick={() => setActiveLink("Borrow")}
              className={activeLink === "Borrow" ? "active" : ""}
            >
              Mượn đồ chơi
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/policy"
              onClick={() => setActiveLink("policy")}
              className={activeLink === "policy" ? "active" : ""}
            >
              Chính sách
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/userguide"
              onClick={() => setActiveLink("userguide")}
              className={activeLink === "userguide" ? "active" : ""}
            >
              Hướng dẫn dùng
            </Nav.Link>
          </Nav>
          <Nav className="ms-auto align-items-center">
            {isLoggedIn ? (
              <>
                <Dropdown align="end" className="message-dropdown me-2">
                  <Dropdown.Toggle variant="link" id="dropdown-messages" className="p-0 position-relative">
                    <FaEnvelope size={20} />
                    {unreadMessages > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="message-menu">
                    {conversations.length > 0 ? (
                      conversations.map((convo, index) => {
                        const isUnread =
                          convo.lastMessageContent &&
                          !convo.isRead &&
                          convo.lastSenderId !== parseInt(userId);
                        return (
                          <Dropdown.Item
                            key={convo.conversationId || `convo-${index}`}
                            onClick={() => handleMarkMessagesAsRead(convo.conversationId)}
                            className={isUnread ? "unread" : "read"}
                          >
                            <strong>{convo.otherUser?.name || "Unknown"}</strong>:{" "}
                            {convo.lastMessageContent || "Chưa có tin nhắn"}
                          </Dropdown.Item>
                        );
                      })
                    ) : (
                      <Dropdown.Item key="no-messages">Không có tin nhắn</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown align="end" className="notification-dropdown me-2">
                  <Dropdown.Toggle variant="link" id="dropdown-notifications" className="p-0">
                    <FaBell size={20} className="notification-icon" />
                    {notificationCount > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="notification-menu">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <Dropdown.Item
                          key={notif.notificationId || `notif-${notif.content}`}
                          onClick={() => !notif.readStatus && handleMarkNotificationAsRead(notif.notificationId)}
                          className={notif.readStatus ? "read" : "unread"}
                        >
                          {notif.content}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item key="no-notifications">Không có thông báo</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" id="dropdown-user" className="p-0">
                    <img src={userAvatar} alt="Avatar" className="user-avatar" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      as={Link}
                      to={`/userdetail/${userId}`}
                      onClick={() => setActiveLink("profile")}
                    >
                      Thông tin cá nhân
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/transaction-history" onClick={() => setActiveLink("transaction-history")}>
                      Lịch sử giao dịch
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/logout" onClick={() => setActiveLink("logout")}>
                      Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" onClick={() => setActiveLink("login")}>
                Đăng nhập
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;