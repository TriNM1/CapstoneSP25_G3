import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./InforInput.scss";
import cameraImg from "../../../assets/camera.jpg"; // Đảm bảo có file ảnh máy ảnh tại đây

const InforInput = () => {
  const [parentName, setParentName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [childAge, setChildAge] = useState("");
  const [isMale, setIsMale] = useState(false); // Nếu tích chọn => Nam, nếu không => Nữ
  const [previewImage, setPreviewImage] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Khởi tạo hook navigate

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đăng ký (ví dụ: kiểm tra mật khẩu, gửi dữ liệu, ...)
    console.log("Tên phụ huynh:", parentName);
    console.log("Mật khẩu:", password);
    console.log("Nhập lại mật khẩu:", confirmPassword);
    console.log("Tuổi của bé:", childAge);
    console.log("Giới tính:", isMale ? "Nam" : "Nữ");
    console.log("Ảnh đã chọn:", previewImage);

    // Sau khi xử lý đăng ký thành công, chuyển hướng sang trang home
    navigate("/home");
  };

  return (
    <div className="container inforinput-wrapper">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 p-0">
          <div className="inforinput-container row no-gutters h-100">
            {/* Cột bên trái: Ảnh máy ảnh */}
            <div className="col-md-6 camera-banner">
              <div className="image-wrapper" onClick={handleImageClick}>
                <img
                  src={previewImage || cameraImg}
                  alt="Chọn ảnh thay thế"
                  className="img-fluid h-100"
                />
                <div className="overlay-text">Chọn ảnh thay thế</div>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
            {/* Cột bên phải: Form đăng ký */}
            <div className="col-md-6 form-container d-flex align-items-center justify-content-center">
              <form className="inforinput-form" onSubmit={handleSubmit}>
                <h2>Đăng Ký</h2>
                <div className="form-group">
                  <input
                    type="text"
                    id="parentName"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Nhập tên phụ huynh"
                    required
                  />
                </div>
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
                <div className="form-group">
                  <select
                    id="childAge"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    required
                  >
                    <option value="">Chọn tuổi của bé</option>
                    <option value="0-12">0-12 tháng tuổi</option>
                    <option value="1-2">1-2 tuổi</option>
                    <option value="2-3">2-3 tuổi</option>
                    <option value="3++">3++</option>
                    <option value="lớn hơn">Lớn hơn</option>
                  </select>
                </div>
                <div className="form-group gender-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={isMale}
                      onChange={(e) => setIsMale(e.target.checked)}
                    />
                    &nbsp;Nam (nếu không chọn, mặc định Nữ)
                  </label>
                </div>
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
