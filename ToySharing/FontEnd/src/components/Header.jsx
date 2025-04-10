/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import { Container, Navbar, Nav, Badge, Dropdown } from "react-bootstrap";
import { FaEnvelope, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import user from "../assets/user.png";
import "./Header.scss";

const Header = ({
  activeLink,
  setActiveLink,
  isLoggedIn,
  unreadMessages,
  notificationCount,
}) => {
  const notifications = [
    { id: 1, text: "Bạn có tin nhắn mới từ Alice" },
    { id: 2, text: "Xe đua mini của bạn đã được mượn" },
    { id: 3, text: "Báo cáo của bạn đã được xử lý" },
  ];
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
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
              to="/lending/listBorrowRequests"
              onClick={() => setActiveLink("listBorrowRequests")}
              className={activeLink === "listBorrowRequests" ? "active" : ""}
            >
              Cho mượn đồ
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/borrowing/searchtoy"
              onClick={() => setActiveLink("searchtoy")}
              className={activeLink === "searchtoy" ? "active" : ""}
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
                <Nav.Link as={Link} to="/message" className="position-relative">
                  <FaEnvelope size={20} />
                  {unreadMessages > 0 && (
                    <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle">
                      {unreadMessages}
                    </Badge>
                  )}
                </Nav.Link>
                <Dropdown align="end" className="notification-dropdown me-2">
                  <Dropdown.Toggle variant="link" id="dropdown-notifications" className="p-0">
                    <FaBell size={20} className="notification-icon" />
                    {notificationCount > 0 && (
                      <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle">
                        {notificationCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="notification-menu">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <Dropdown.Item key={notif.id}>{notif.text}</Dropdown.Item>
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