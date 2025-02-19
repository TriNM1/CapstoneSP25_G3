import React, { useState } from "react";
import { Container, Carousel, Row, Col, Card, Button } from "react-bootstrap";
import { FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import Header from "../../components/Header";
import "./Home.scss"; // File SCSS tùy chỉnh
import banner1 from "../../assets/banner1.jpg";
import banner2 from "../../assets/banner2.jpg";
import banner3 from "../../assets/banner3.jpg";
import banner4 from "../../assets/banner4.jpg";
import toy1 from "../../assets/toy1.jpg";
import user from "../../assets/user.png";

const Home = () => {
  // State đăng nhập và active nav link
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

  // Số tin nhắn và thông báo chưa đọc
  const unreadMessages = 3;
  const notificationCount = 2;

  // Mảng banner
  const banners = [banner1, banner2, banner3, banner4];

  // Mảng dữ liệu các sản phẩm đồ chơi (6 sản phẩm mẫu)
  const toys = [
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      price: "50,000 VND",
      status: "Còn trống",
      distance: 2.5,
      lenderAvatar: user,
    },
    {
      id: 2,
      image: toy1,
      name: "Robot chơi",
      price: "70,000 VND",
      status: "Hết đồ",
      distance: 1.8,
      lenderAvatar: user,
    },
    {
      id: 3,
      image: toy1,
      name: "Búp bê Barbie",
      price: "60,000 VND",
      status: "Còn trống",
      distance: 3.2,
      lenderAvatar: user,
    },
    {
      id: 4,
      image: toy1,
      name: "Khối xếp hình",
      price: "40,000 VND",
      status: "Còn trống",
      distance: 2.0,
      lenderAvatar: user,
    },
    {
      id: 5,
      image: toy1,
      name: "Xe điều khiển",
      price: "80,000 VND",
      status: "Hết đồ",
      distance: 4.5,
      lenderAvatar: user,
    },
    {
      id: 6,
      image: toy1,
      name: "Đồ chơi xếp hình",
      price: "30,000 VND",
      status: "Còn trống",
      distance: 1.2,
      lenderAvatar: user,
    },
  ];

  return (
    <div className="home-page">
      {/* Thanh menu dùng chung */}
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={isLoggedIn}
        unreadMessages={unreadMessages}
        notificationCount={notificationCount}
      />

      {/* Banner */}
      <div className="banner-section">
        <Carousel indicators={false} controls={true} interval={3000}>
          {banners.map((banner, index) => (
            <Carousel.Item key={index}>
              <img
                className="d-block w-100 banner-image"
                src={banner}
                alt={`Slide ${index + 1}`}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Đồ chơi đề xuất */}
      <Container className="mt-4">
        <h2 className="section-title">Đồ chơi đề xuất</h2>
        <Row>
          {toys.map((toy) => (
            <Col key={toy.id} xs={12} md={4} className="mb-4">
              <Card className="toy-card">
                <Card.Img variant="top" src={toy.image} className="toy-image" />
                <Card.Body>
                  <Card.Title className="toy-name">{toy.name}</Card.Title>
                  <Card.Text className="toy-price">{toy.price}</Card.Text>
                  <Card.Text className="toy-status">
                    <strong>Trạng thái: </strong>
                    <span
                      className={
                        toy.status === "Còn trống" ? "available" : "unavailable"
                      }
                    >
                      {toy.status}
                    </span>
                  </Card.Text>
                  <Card.Text className="toy-distance">
                    <strong>Khoảng cách: </strong>
                    {toy.distance} km
                  </Card.Text>
                  <div className="lender-info d-flex align-items-center mb-2">
                    <img
                      src={toy.lenderAvatar}
                      alt="Lender Avatar"
                      className="lender-avatar"
                    />
                    <a className="ms-2" href="/userinfo" id="trangcanhanlink">
                      Trang cá nhân người cho mượn
                    </a>
                  </div>
                  <div className="toy-actions d-flex justify-content-between">
                    <Button variant="primary" size="lg">
                      Mượn
                    </Button>
                    <Button variant="secondary" size="lg">
                      Nhắn tin
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center">
          <Button variant="outline-primary" className="view-more-btn">
            Xem thêm
          </Button>
        </div>
      </Container>

      <footer className="footer mt-4 py-3 bg-light">
        <Container>
          <Row>
            <Col xs={12} md={6}>
              <p>
                <FaMapMarkerAlt className="footer-icon" />
                Địa chỉ: Số 123, Đường ABC, Quận XYZ, Thành phố HCM
              </p>
            </Col>
            <Col xs={12} md={6} className="text-md-end">
              <p>
                <FaPhoneAlt className="footer-icon" />
                Số điện thoại: 0123 456 789
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;
