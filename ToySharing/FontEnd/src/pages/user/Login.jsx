import React, { useState } from "react";
import "./Login.scss";
import icon from "../../assets/google-icon.png";
import banner from "../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate(); // Khởi tạo hook navigate

  const handleSubmit = (e) => {
    e.preventDefault();
    // Đăng nhập thành công, chuyển hướng sang trang home
    navigate("/home");
  };

  const handleGoogleLogin = () => {
    // Xử lý đăng nhập với Google tại đây
    console.log("Đăng nhập với Google");
  };

  return (
    <div className="container login-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          {/* Container chứa cả banner và form */}
          <div className="login-container row no-gutters h-100">
            {/* Cột banner bên trái */}
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            {/* Cột form đăng nhập bên phải */}
            <div className="col-md-6 login-form-container d-flex align-items-center justify-content-center">
              <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đăng Nhập</h2>

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
                  <label htmlFor="password">Mật khẩu</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>

                <div className="form-options">
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label htmlFor="remember">Ghi nhớ đăng nhập</label>
                  </div>
                </div>

                <div className="forgot-password">
                  <a href="/forgot-password">Quên mật khẩu?</a>
                </div>

                <button type="submit" className="btn login-btn">
                  Đăng Nhập
                </button>

                <button
                  type="button"
                  className="btn google-btn"
                  onClick={handleGoogleLogin}
                >
                  <img src={icon} alt="Google Icon" className="google-icon" />
                  Đăng nhập với Google
                </button>

                <div className="register-link">
                  <span>Bạn chưa có tài khoản?</span>
                  <a href="/register">Đăng ký</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
