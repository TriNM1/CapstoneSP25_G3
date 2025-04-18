import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import Footer from "../../../components/footer";

const ToyDetail = ({ isLoggedIn, setActiveLink }) => {
  const { toyId } = useParams();
  const [toy, setToy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToyDetail = async () => {
      try {
        const response = await fetch(`https://localhost:7128/api/Products/${toyId}`);
        if (!response.ok) {
          throw new Error("Không thể lấy thông tin đồ chơi");
        }
        const data = await response.json();
        setToy(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchToyDetail();
  }, [toyId]);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} setActiveLink={setActiveLink} />
      <div>
        <h1>Thông tin chi tiết đồ chơi</h1>
        {toy && (
          <div>
            <div>
              <h3>Hình ảnh:</h3>
              {toy.imagePaths.map((path, index) => (
                <img key={index} src={path} alt={`Toy Image ${index}`} />
              ))}
            </div>
            <h2>{toy.name}</h2>
            <p>Danh mục: {toy.categoryName}</p>
            <p>Số lượng có sẵn: {toy.available}</p>
            <p>Mô tả: {toy.description}</p>
            <p>Trạng thái: {toy.productStatus}</p>
            <p>Giá: {toy.price}</p>
            <p>Độ tuổi phù hợp: {toy.suitableAge}</p>
            <p>Ngày đăng: {new Date(toy.createdAt).toLocaleDateString()}</p>
            
            <p>Số lần đã cho mượn: {toy.borrowCount}</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ToyDetail;