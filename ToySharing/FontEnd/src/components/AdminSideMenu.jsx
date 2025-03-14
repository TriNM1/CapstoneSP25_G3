import React from "react";
import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaEnvelope, FaBell } from "react-icons/fa";
import userIcon from "../assets/user.png";
import logo from "../assets/logo.png";
import "./AdminSideMenu.scss";

const AdminSideMenu = ({ menuItems }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="admin-side-menu">
      <div className="top-section">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="icons">
          <Link to="/message" className="icon-link">
            <FaEnvelope size={20} />
          </Link>
          <Dropdown align="end" className="notification-dropdown">
            <Dropdown.Toggle
              variant="link"
              id="dropdown-notifications"
              className="p-0"
            >
              <FaBell size={20} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="notification-menu">
              <Dropdown.Item>Thông báo 1</Dropdown.Item>
              <Dropdown.Item>Thông báo 2</Dropdown.Item>
              <Dropdown.Item>Thông báo 3</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Link to="/adminprofile" className="icon-link">
            <img src={userIcon} alt="User" className="user-icon" />
          </Link>
        </div>
      </div>
      <Nav className="flex-column menu-links">
        {menuItems.map((item) => (
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
