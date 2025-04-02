import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./InforInput.scss";
import banner from "../../../assets/bannerdangnhap.jpg";

const InforInput = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [contact, setContact] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedContact = localStorage.getItem("user_contact");
    if (!savedContact) {
      navigate("/signup");
    } else {
      setContact(savedContact);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:7128/api/Auth/Register",
        { Email: contact, Password: password }
      );

      if (response.status === 200) {
        setSuccessMessage("Đăng ký tài khoản thành công!");
        localStorage.removeItem("user_contact");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const errorMessage =
        error.response?.data || "Đăng ký thất bại. Vui lòng thử lại!";
      setError(errorMessage);
    }
  };

  return (
    <div className="container inforinput-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          <div className="inforinput-container row no-gutters h-100">
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            <div className="col-md-6 form-container d-flex align-items-center justify-content-center">
              <form className="inforinput-form" onSubmit={handleSubmit}>
                <h2>Thiết lập mật khẩu</h2>
                <div className="form-group">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
                {successMessage && (
                  <p className="success-text">{successMessage}</p>
                )}
                <button type="submit" className="btn register-btn">
                  Đăng ký
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InforInput;