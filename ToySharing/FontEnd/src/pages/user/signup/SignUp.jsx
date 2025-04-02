import React, { useState } from "react";
import axios from "axios";
import "./SignUp.scss";
import banner from "../../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(
        "https://localhost:7128/api/Auth/RequestOTP",
        { Email: contact }
      );
      if (response.status === 200) {
        localStorage.setItem("user_contact", contact);
        navigate("/validatemail");
      }
    } catch (error) {
      console.error("Lỗi gửi OTP:", error);
      setError(
        error.response?.data || "Gửi OTP thất bại. Vui lòng thử lại!"
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
                <h2>Đăng Ký</h2>
                <div className="form-group">
                  <label htmlFor="contact">Email</label>
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