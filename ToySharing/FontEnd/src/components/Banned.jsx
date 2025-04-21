import React from "react";
import "./Banned.scss";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Banned = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="banned-wrapper">
      <div className="banned-container">
        <h1>Tài Khoản Bị Cấm</h1>
        <p>
          Rất tiếc, tài khoản của bạn đã bị cấm khỏi hệ thống do vi phạm chính sách sử dụng.
          Để biết thêm chi tiết hoặc yêu cầu gỡ cấm, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
        </p>
        <div className="contact-info">
          <h3>Thông Tin Liên Hệ</h3>
          <p><strong>Email:</strong> support@toysharing.com</p>
          <p><strong>Số điện thoại:</strong> (+84) 123-456-789</p>
          <p><strong>Website:</strong> <a href="https://toysharing.com/support">toysharing.com/support</a></p>
        </div>
        <Button variant="primary" onClick={handleBackToLogin}>
          Quay Lại Trang Đăng Nhập
        </Button>
      </div>
    </div>
  );
};

export default Banned;