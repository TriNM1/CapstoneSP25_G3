import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { logout } from "../utils/auth";
import "./Logout.scss";

const Logout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          navigate("/login");
        }, 2000);
      }
    };
    handleLogout();
  }, [navigate]);

  return (
    <div className="logout-container">
      {isLoading ? (
        <div className="loading-wrapper">
          <Spinner animation="border" role="status" variant="primary" />
          <span className="ms-2">Đang đăng xuất...</span>
        </div>
      ) : null}
    </div>
  );
};

export default Logout;