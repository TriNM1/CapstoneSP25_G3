import jwtDecode from "jwt-decode";

// Hàm lấy token từ localStorage hoặc sessionStorage
export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Hàm giải mã token để lấy userId
export const getUserId = () => {
  const token = getToken();
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.userId; // ID này phải do backend cung cấp trong token
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      return null;
    }
  }
  return null;
};

// Hàm kiểm tra người dùng có đăng nhập hay không
export const isAuthenticated = () => {
  return !!getToken();
};

// Hàm đăng xuất người dùng
export const logout = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  window.location.href = "/login"; // Điều hướng về trang đăng nhập
};
