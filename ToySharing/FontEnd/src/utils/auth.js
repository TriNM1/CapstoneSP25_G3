import axios from "axios";

const API_BASE_URL = "https://localhost:7128/api";

// Hàm đăng xuất
export const logout = async () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    window.location.href = "/login";
    return;
  }

  try {
    await axios.post(
      `${API_BASE_URL}/Auth/Logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("API logout gọi thành công");
  } catch (error) {
    console.error("Lỗi khi gọi API logout:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    // window.location.href = "/login"; // Chuyển hướng về trang đăng nhập
  }
};