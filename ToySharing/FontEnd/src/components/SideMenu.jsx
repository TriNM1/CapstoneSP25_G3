import React from "react";
import "./SideMenu.scss";

const SideMenu = ({ menuItems, activeItem, onMenuItemClick }) => {
  return (
    <div className="side-menu">
      <div className="menu-icon">☰</div>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id} className={activeItem === item.id ? "active" : ""}>
            <a href={item.link} onClick={() => onMenuItemClick(item.id)}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideMenu;
