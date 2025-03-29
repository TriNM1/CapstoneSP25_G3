import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios
import { useNavigate } from "react-router-dom";
import "./ValidateMail.scss";
import banner from "../../../assets/bannerdangnhap.jpg";

const ValidateMail = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [contact, setContact] = useState("");

  useEffect(() => {
    // Lấy email từ localStorage
    const savedContact = localStorage.getItem("user_contact");
    if (!savedContact) {
      navigate("/signup"); // Nếu không có email, quay lại trang đăng ký
    } else {
      setContact(savedContact);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("https://localhost:7128/api/Auth/ConfirmOTP", {
        otp: otp, // API yêu cầu trường `OTP`
      });

      if (response.status === 200) {
        navigate("/inforinput"); // OTP hợp lệ, chuyển trang
      }
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error);
      setError("Mã OTP không hợp lệ hoặc đã hết hạn!");
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
                <h2>Nhập OTP</h2>
                <p>Mã OTP đã được gửi đến: <strong>{contact}</strong></p>
                <div className="form-group">
                  <label htmlFor="otp">Nhập mã OTP (6 chữ số)</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Mã xác thực"
                    required
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
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
