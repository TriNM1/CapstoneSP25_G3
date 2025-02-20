import React from "react";
import { Link } from "react-router-dom";
import "./SideMenu.scss";

const SideMenu = ({ menuItems, activeItem }) => {
  return (
    <div className="side-menu">
      <div className="menu-icon">☰</div>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id} className={activeItem === item.id ? "active" : ""}>
            <Link to={item.link}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideMenu;
