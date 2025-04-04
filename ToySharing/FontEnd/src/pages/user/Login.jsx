import React, { useState } from "react";
import "./Login.scss";
import icon from "../../assets/google-icon.png";
import banner from "../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("📤 Gửi yêu cầu đăng nhập với:", { email, password });
    try {
      const response = await fetch("https://localhost:7128/api/Auth/Login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();
      console.log("📥 Phản hồi từ API:", data);
      if (response.ok) {
        const { jwtToken, userId } = data;
        if (!jwtToken || !userId) {
          setError("Không nhận được token hoặc userId từ server!");
          return;
        }

        if (remember) {
          localStorage.setItem("token", jwtToken);
          localStorage.setItem("userId", userId);
          console.log("Token lưu vào localStorage:", localStorage.getItem("token"));
          console.log("UserId lưu vào localStorage:", localStorage.getItem("userId"));
        } else {
          sessionStorage.setItem("token", jwtToken);
          sessionStorage.setItem("userId", userId);
          console.log("Token lưu vào sessionStorage:", sessionStorage.getItem("token"));
          console.log("UserId lưu vào sessionStorage:", sessionStorage.getItem("userId"));
        }

        console.log("✅ Đăng nhập thành công! Token:", jwtToken, "UserId:", userId);
        navigate("/home");
      } else {
        setError(data.message || "Đăng nhập thất bại! Vui lòng kiểm tra lại email hoặc mật khẩu.");
        console.warn("⚠️ Lỗi từ API:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      setError("Không thể kết nối đến máy chủ. Hãy thử lại sau!");
    }
  };

  const handleGoogleLogin = () => {
    console.log("Đăng nhập với Google");
  };

  return (
    <div className="container login-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          <div className="login-container row no-gutters h-100">
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            <div className="col-md-6 login-form-container d-flex align-items-center justify-content-center">
              <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đăng Nhập</h2>
                {error && <p className="error-message">{error}</p>}
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
                <button type="button" className="btn google-btn" onClick={handleGoogleLogin}>
                  <img src={icon} alt="Google Icon" className="google-icon" />
                  Đăng nhập với Google
                </button>
                <div className="register-link">
                  <span>Bạn chưa có tài khoản?</span>
                  <a href="/signup">Đăng ký</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>

  );
};

export default Login;