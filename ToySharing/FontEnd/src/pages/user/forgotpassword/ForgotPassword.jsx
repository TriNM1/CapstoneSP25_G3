import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.scss";
import banner from "../../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const response = await axios.post(
        "https://localhost:7128/api/Auth/ForgotPassword",
        { Email: contact }
      );
      if (response.status === 200) {
        setSuccessMessage("Mật khẩu mới đã được gửi đến địa chỉ email của bạn, vui lòng kiểm tra!");
        localStorage.removeItem("user_contact");
        setTimeout(() => {
          navigate("/login");
        }, 4000);
      }
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      setError(
        error.response?.data || "Gửi email thất bại. Vui lòng thử lại!"
      );
    }
  };

  return (
    <div className="container signup-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          <div className="signup-container row no-gutters h-100">
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            <div className="col-md-6 signup-form-container d-flex align-items-center justify-content-center">
              <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Quên mật khẩu</h2>
                <div className="form-group">
                  <label htmlFor="contact">Địa chỉ email tài khoản của bạn</label>
                  <input
                    type="email"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                {successMessage && (
                  <p className="success-text">{successMessage}</p>
                )}
                <button type="submit" className="btn verify-btn">
                  Lấy lại mật khẩu
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;