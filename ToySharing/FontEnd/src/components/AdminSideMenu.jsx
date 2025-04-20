import React from "react";
import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaEnvelope, FaBell } from "react-icons/fa";
import userIcon from "../assets/user.png";
import logo from "../assets/logo.png";
import user from "../assets/user.png";
import "./AdminSideMenu.scss";

const AdminSideMenu = ({ menuItems = [], activelink, setActiveLink }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="admin-side-menu">
      <div className="top-section">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <Dropdown className="icons">
          <Dropdown.Toggle variant="link" id="dropdown-user" className="p-0">
            <img src={user} alt="Avatar" className="user-avatar" />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item
              as={Link}
              to={"/adminprofile"}
              onClick={() => setActiveLink && setActiveLink("profile")}
            >
              Thông tin cá nhân
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              to="/logout"
              onClick={() => setActiveLink && setActiveLink("logout")}
            >
              Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <Nav className="flex-column menu-links">
        {Array.isArray(menuItems) && menuItems.map((item) => (
          <Nav.Link
            as={Link}
            to={item.link}
            key={item.id}
            className={currentPath === item.link ? "active" : ""}
          >
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};

export default AdminSideMenu;