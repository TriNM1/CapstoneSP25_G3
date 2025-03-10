/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
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
  // Danh sách thông báo mẫu (bạn có thể thay đổi hoặc lấy từ API)
  const notifications = [
    { id: 1, text: "Bạn có tin nhắn mới từ Alice" },
    { id: 2, text: "Xe đua mini của bạn đã được mượn" },
    { id: 3, text: "Báo cáo của bạn đã được xử lý" },
  ];

  return (
    <Navbar bg="light" expand="lg" className="main-navbar">
      <Container>
        <Navbar.Brand
          href="#home"
          onClick={() => setActiveLink("home")}
          className={activeLink === "home" ? "active" : ""}
        >
          <img src={logo} alt="Logo" className="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              href="/home"
              onClick={() => setActiveLink("home")}
              className={activeLink === "home" ? "active" : ""}
            >
              Trang chủ
            </Nav.Link>
            <Nav.Link
              href="/lending/listBorrowRequests"
              onClick={() => setActiveLink("listBorrowRequests")}
              className={activeLink === "listBorrowRequests" ? "active" : ""}
            >
              Cho mượn đồ
            </Nav.Link>
            <Nav.Link
              href="/borrowing/searchtoy"
              onClick={() => setActiveLink("searchtoy")}
              className={activeLink === "searchtoy" ? "active" : ""}
            >
              Mượn đồ chơi
            </Nav.Link>
            <Nav.Link
              href="/policy"
              onClick={() => setActiveLink("policy")}
              className={activeLink === "policy" ? "active" : ""}
            >
              Chính sách
            </Nav.Link>
            <Nav.Link
              href="/userguide"
              onClick={() => setActiveLink("userguide")}
              className={activeLink === "userguide" ? "active" : ""}
            >
              Hướng dẫn dùng
            </Nav.Link>
          </Nav>
          <Nav className="ms-auto align-items-center">
            <Nav.Link href="/message" className="position-relative">
              <FaEnvelope size={20} />
              {unreadMessages > 0 && (
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {unreadMessages}
                </Badge>
              )}
            </Nav.Link>
            <Dropdown align="end" className="notification-dropdown">
              <Dropdown.Toggle
                variant="link"
                id="dropdown-notifications"
                className="p-0"
              >
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
                    <Dropdown.Item key={notif.id}>{notif.text}</Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item>Không có thông báo</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
            {!isLoggedIn ? (
              <Nav.Link
                as={Link}
                to="/login"
                onClick={() => setActiveLink("login")}
              >
                Đăng nhập
              </Nav.Link>
            ) : (
              <Nav.Link
                href="#profile"
                onClick={() => setActiveLink("profile")}
                className={activeLink === "profile" ? "active" : ""}
              >
                <img src={user} alt="Avatar" className="user-avatar" />
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
