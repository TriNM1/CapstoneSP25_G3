import React, { useState } from "react";
import "./SignUp.scss";
import banner from "../../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("https://localhost:7128/api/Auth/RequestOTP", { email: contact });

      if (response.status === 200) {
        setMessage("OTP đã được gửi đến email của bạn!");

        // 🔹 Lưu email vào localStorage để dùng ở trang xác thực OTP
        localStorage.setItem("userEmail", contact);

        setTimeout(() => {
          navigate("/validatemail"); // Chuyển trang mà không cần truyền email qua state
        }, 1000);
      } else {
        setMessage("Lỗi khi gửi OTP.");
      }
    } catch (error) {
      setMessage("Không thể gửi OTP. Kiểm tra lại email!");
    } finally {
      setLoading(false);
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
                  <label htmlFor="contact">Email hoặc Số điện thoại</label>
                  <input
                    type="text"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
                <button type="submit" className="btn verify-btn" disabled={loading}>
                  {loading ? "Đang gửi OTP..." : "Xác thực"}
                </button>
                {message && <p className="message">{message}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
