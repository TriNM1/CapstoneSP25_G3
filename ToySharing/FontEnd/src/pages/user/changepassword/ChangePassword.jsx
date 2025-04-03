import React, { useState } from "react";
import axios from "axios";
import "./ChangePassword.scss";
import banner from "../../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!isValidEmail(email)) {
      setError("Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@domain.com)!");
      return;
    }

    if (!isValidPassword(oldPassword)) {
      setError("Mật khẩu cũ phải có ít nhất 6 ký tự!");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const token = sessionToken || localToken;
    console.log("localStorage token:", localToken);
    console.log("sessionStorage token:", sessionToken);
    console.log("Token gửi đi:", token);

    if (!token) {
      setError("Bạn cần đăng nhập để đổi mật khẩu!");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:7128/api/Auth/ChangePassword",
        {
          email: email,
          oldPassword: oldPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setSuccessMessage("Mật khẩu đã được thay đổi thành công!");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      console.log("Response lỗi:", error.response);
      setError(
        error.response?.data || "Đổi mật khẩu thất bại. Vui lòng thử lại!"
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
                <h2>Đổi mật khẩu</h2>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="oldPassword">Mật khẩu cũ</label>
                  <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                {successMessage && <p className="success-text">{successMessage}</p>}
                <button type="submit" className="btn verify-btn">
                  Đổi mật khẩu
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;