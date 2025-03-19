import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ValidateMail.scss";
import banner from "../../../assets/bannerdangnhap.jpg";

const ValidateMail = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận email từ SignUp
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      setMessage("Không tìm thấy email. Quay lại đăng ký!");
    }
  }, [email]);

  // Xác thực OTP
  const handleVerifyOtp = async (e) => {
  e.preventDefault();
  if (!email || !otp) {
    setMessage("Email hoặc mã OTP không hợp lệ!");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const response = await axios.post("https://localhost:7128/api/Auth/ConfirmOTP", {
      email: email.trim(), // Đảm bảo không có khoảng trắng
      otp: otp.toString().trim(), // Chuyển OTP thành string và loại bỏ khoảng trắng
    });

    console.log("Kết quả API:", response.data);

    if (response.status === 200 && response.data.success) {
      setMessage("Xác thực thành công! Chuyển hướng...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage("Mã OTP không đúng, vui lòng thử lại.");
    }
  } catch (error) {
    console.error("Lỗi API:", error.response?.data);
    setMessage("Lỗi khi xác thực OTP. Kiểm tra lại mã và email!");
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
              <form className="signup-form" onSubmit={handleVerifyOtp}>
                <h2>Xác nhận OTP</h2>
                {email && <p>Email: {email}</p>}
                <div className="form-group">
                  <label htmlFor="otp">Nhập mã OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Mã OTP"
                    required
                  />
                </div>
                <button type="submit" className="btn verify-btn" disabled={loading}>
                  {loading ? "Đang xác thực..." : "Xác thực"}
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

export default ValidateMail;
