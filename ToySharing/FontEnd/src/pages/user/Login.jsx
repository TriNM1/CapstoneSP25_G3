import React, { useState } from "react";
import "./Login.scss";
import icon from "../../assets/google-icon.png";
import banner from "../../assets/bannerdangnhap.jpg";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
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

      if (response.status === 403) {
        // Banned user
        navigate("/banned");
        return;
      }

      if (response.ok) {
        const { jwtToken, userId, isProfileCompleted, role, status } = data;

        if (!jwtToken || !userId) {
          toast.error("Không nhận được token hoặc userId từ server!");
          return;
        }

        // Check if user is banned (fallback)
        if (status === 1) {
          navigate("/banned");
          return;
        }

        // Store data based on "remember me"
        if (remember) {
          localStorage.clear();
          localStorage.setItem("token", jwtToken);
          localStorage.setItem("userId", userId);
          localStorage.setItem("isProfileCompleted", isProfileCompleted);
          localStorage.setItem("role", role);
          localStorage.setItem("status", status);
          console.log("Token lưu vào localStorage:", localStorage.getItem("token"));
          console.log("UserId lưu vào localStorage:", localStorage.getItem("userId"));
          console.log("IsProfileCompleted lưu vào localStorage:", localStorage.getItem("isProfileCompleted"));
          console.log("Role lưu vào localStorage:", localStorage.getItem("role"));
          console.log("Status lưu vào localStorage:", localStorage.getItem("status"));
        } else {
          localStorage.clear();
          sessionStorage.setItem("token", jwtToken);
          sessionStorage.setItem("userId", userId);
          sessionStorage.setItem("isProfileCompleted", isProfileCompleted);
          sessionStorage.setItem("role", role);
          sessionStorage.setItem("status", status);
          console.log("Token lưu vào sessionStorage:", sessionStorage.getItem("token"));
          console.log("UserId lưu vào sessionStorage:", sessionStorage.getItem("userId"));
          console.log("IsProfileCompleted lưu vào sessionStorage:", sessionStorage.getItem("isProfileCompleted"));
          console.log("Role lưu vào sessionStorage:", sessionStorage.getItem("role"));
          console.log("Status lưu vào sessionStorage:", sessionStorage.getItem("status"));
        }
        console.log("✅ Đăng nhập thành công! Token:", jwtToken, "UserId:", userId, "isProfileCompleted:", isProfileCompleted, "role:", role, "status:", status);

        // Redirect based on role
        if (role === "Admin") {
          navigate("/adminpage");
        } else if (role === "User") {
          navigate("/home");
        } else {
          toast.error("Vai trò không hợp lệ!");
          navigate("/login");
        }
      } else {
        // Handle specific error messages
        if (data.message === "Tài khoản chưa được đăng ký trên hệ thống.") {
          setEmailError(data.message);
          toast.error(data.message);
        } else if (data.message === "Mật khẩu không chính xác.") {
          setPasswordError(data.message);
          toast.error(data.message);
        } else {
          toast.error(data.message || "Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin.");
        }
        console.warn("⚠️ Lỗi từ API:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      toast.error("Có lỗi xảy ra khi đăng nhập! Vui lòng thử lại.");
    }
  };

  const handleGoogleLogin = () => {
    console.log("Đăng nhập với Google");
  };

  return (
    <div className="container login-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-10 p-0">
          <div className="login-container row no-gutters h-100">
            <div className="col-md-6 banner">
              <img src={banner} alt="Banner" className="img-fluid h-100" />
            </div>
            <div className="col-md-6 login-form-container d-flex align-items-center justify-content-center">
              <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đăng Nhập</h2>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="Nhập email của bạn"
                    className={emailError ? "is-invalid" : ""}
                    required
                  />
                  {emailError && <div className="invalid-feedback">{emailError}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập mật khẩu"
                    className={passwordError ? "is-invalid" : ""}
                    required
                  />
                  {passwordError && <div className="invalid-feedback">{passwordError}</div>}
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
                <div className="register-link">
                  <span>Bạn chưa có tài khoản?</span>
                  <a href="/signup">Đăng ký</a>
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