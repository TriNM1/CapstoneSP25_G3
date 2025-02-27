import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./ValidateMail.scss";
import banner from "../../../assets/bannerdangnhap.jpg";

const ValidateMail = () => {
  const [contact, setContact] = useState("");
  const navigate = useNavigate(); // Khởi tạo hook navigate

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic xác thực mã, ví dụ: gửi mã xác thực, hoặc chuyển sang bước tiếp theo
    console.log("Contact:", contact);
    // Chuyển hướng sang trang InforInput
    navigate("/inforinput");
  };

  return (
    <div className="container signup-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          {/* Container chứa banner và form xác thực */}
          <div className="signup-container row no-gutters h-100">
            {/* Cột banner bên trái */}
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            {/* Cột form xác thực bên phải */}
            <div className="col-md-6 signup-form-container d-flex align-items-center justify-content-center">
              <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Đăng Ký</h2>
                <div className="form-group">
                  <label htmlFor="contact">
                    Nhập 6 chữ số xác thực đã được gửi về email của bạn
                  </label>
                  <input
                    type="text"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Mã xác thực"
                    required
                  />
                </div>
                <button type="submit" className="btn verify-btn">
                  Xác thực
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidateMail;
