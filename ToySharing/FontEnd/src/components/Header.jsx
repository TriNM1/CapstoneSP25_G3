/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Container, Navbar, Nav, Badge, Dropdown } from "react-bootstrap";
import { FaEnvelope, FaBell } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import axios from "axios";
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
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation(); // Use the useLocation hook

  useEffect(() => {
    const path = location.pathname;
    if (path === "/home") {
      setActiveLink("home");
    } else if (path === "/mytoy" || path === "/inlending" || path === "/listborrowrequests" || path === "/transferhistory" || path === "/addtoy") {
      setActiveLink("Lender");
    } else if (path === "/searchtoy" || path === "/sendingrequest" || path === "/borrowhistory") {
      setActiveLink("Borrow");
    } else if (path === "/policy") {
      setActiveLink("policy");
    } else if (path === "/userguide") {
      setActiveLink("userguide");
    }
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
        setNotifications(response.data);
        setNotificationCount(response.data.filter(notif => !notif.readStatus).length);
      } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        setNotifications([]);
        setNotificationCount(0);
      }
    };
    fetchNotifications();
  }, [location.pathname, setActiveLink, isLoggedIn, token]);

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
        setConversations(response.data);
        const unreadCount = response.data.reduce((count, convo) => {
          return count + (convo.lastMessageContent && !convo.isRead && convo.lastSenderId !== parseInt(userId) ? 1 : 0);
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
      setNotificationCount((prev) => prev - 1);
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
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== parseInt(userId));
      await Promise.all(
        unreadMessages.map(msg =>
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
      setUnreadMessages((prev) => prev - unreadMessages.length);
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
                      conversations.map((convo) => {
                        const isUnread = convo.lastMessageContent && !convo.isRead && convo.lastSenderId !== parseInt(userId);
                        return (
                          <Dropdown.Item
                            key={convo.conversationId}
                            onClick={() => handleMarkMessagesAsRead(convo.conversationId)}
                            className={isUnread ? "unread" : "read"}
                          >
                            <strong>{convo.otherUser.name}</strong>: {convo.lastMessageContent || "Chưa có tin nhắn"}
                          </Dropdown.Item>
                        );
                      })
                    ) : (
                      <Dropdown.Item>Không có tin nhắn</Dropdown.Item>
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
                          key={notif.notificationId}
                          onClick={() => !notif.readStatus && handleMarkNotificationAsRead(notif.notificationId)}
                          className={notif.readStatus ? "read" : "unread"}
                        >
                          {notif.content}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item>Không có thông báo</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" id="dropdown-user" className="p-0">
                    <img src={user} alt="Avatar" className="user-avatar" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      as={Link}
                      to={`/userdetail/${userId}`}
                      onClick={() => setActiveLink("profile")}
                    >
                      Thông tin cá nhân
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