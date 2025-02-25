import React, { useState } from "react";
import "./SignUp.scss";
import banner from "../../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const SignUp = () => {
  const [contact, setContact] = useState("");
  const navigate = useNavigate(); // Khởi tạo hook navigate

  const handleSubmit = (e) => {
    e.preventDefault();
    // Đăng nhập thành công, chuyển hướng sang trang home
    navigate("/validatemail");
  };

  return (
    <div className="container signup-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          {/* Container chứa banner và form đăng ký */}
          <div className="signup-container row no-gutters h-100">
            {/* Cột banner bên trái */}
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            {/* Cột form đăng ký bên phải */}
            <div className="col-md-6 signup-form-container d-flex align-items-center justify-content-center">
              <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Đăng Ký</h2>
                <div className="form-group">
                  <label htmlFor="contact">Email hoặc Số điện thoại</label>
                  <input
                    type="text"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Nhập email hoặc số điện thoại của bạn"
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

export default SignUp;
