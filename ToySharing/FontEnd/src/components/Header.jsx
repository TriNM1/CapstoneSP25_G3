import React from "react";
import { Container, Navbar, Nav, Badge } from "react-bootstrap";
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
              href="#chinh-sach"
              onClick={() => setActiveLink("chinh-sach")}
              className={activeLink === "chinh-sach" ? "active" : ""}
            >
              Chính sách
            </Nav.Link>
            <Nav.Link
              href="#huong-dan"
              onClick={() => setActiveLink("huong-dan")}
              className={activeLink === "huong-dan" ? "active" : ""}
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
            <Nav.Link href="#notifications" className="position-relative">
              <FaBell size={20} />
              {notificationCount > 0 && (
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {notificationCount}
                </Badge>
              )}
            </Nav.Link>
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
