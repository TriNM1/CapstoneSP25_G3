import React from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import Footer from "../../../components/footer";
const ToyDetail = () => {
  const { toyId } = useParams();

  return (
    <>
    <Header isLoggedIn={isLoggedIn} setActiveLink={setActiveLink} />
    <div>
      <h1>Thông tin chi tiết đồ chơi</h1>
      <p>ID đồ chơi: {toyId}</p>
      {/* Bạn có thể gọi API để lấy dữ liệu dựa trên toyId */}
    </div>
    </>
    
  );
  
};

export default ToyDetail;
