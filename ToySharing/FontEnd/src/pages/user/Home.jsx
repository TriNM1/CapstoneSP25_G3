import React, { useState, useEffect } from "react";
import {
  Container,
  Carousel,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../components/Header";
import toy1 from "../../assets/toy1.jpg";
import banner1 from "../../assets/banner1.jpg";
import banner2 from "../../assets/banner2.jpg";
import banner3 from "../../assets/banner3.jpg";
import banner4 from "../../assets/banner4.jpg";
import banner_test from "../../assets/banner_test.jpg";
import banner_test2 from "../../assets/banner_test2.jpg";
import user from "../../assets/user.png";
import "./Home.scss";
import Footer from "../../components/footer";
import SideBanner from "../../components/SideBanner";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const unreadMessages = 3;
  const notificationCount = 2;

  useEffect(() => {
    // Kiểm tra token trong localStorage hoặc sessionStorage để xác định trạng thái đăng nhập
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Dữ liệu banner
  const banners = [banner1, banner2, banner3, banner4];

  // Dữ liệu danh sách đồ chơi
  const [toyList, setToyList] = useState([
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
  ]);

  // State và hàm xử lý modal mượn đồ chơi
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  const handleOpenBorrowModal = (toyId) => {
    setSelectedToyId(toyId);
    setShowBorrowModal(true);
  };

  const handleCloseBorrowModal = () => {
    setShowBorrowModal(false);
    setBorrowStart(null);
    setBorrowEnd(null);
    setNote("");
    setSelectedToyId(null);
  };

  const handleSendRequest = () => {
    console.log({ borrowStart, borrowEnd, note, selectedToyId });
    setToyList((prevList) =>
      prevList.filter((toy) => toy.id !== selectedToyId)
    );
    toast.success("Gửi yêu cầu mượn thành công!");
    handleCloseBorrowModal();
  };

  const handleNavigateToDetail = (toyId) => {
    navigate(`/toydetail/${toyId}`);
  };

  return (
    <div className="home-wrapper">
      <div className="side-banner left-banner">
        <img src={banner_test} alt="Left Banner" />
      </div>
      <div className="home-page">
        {/* Truyền prop isLoggedIn xuống Header */}
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

        {/* Danh sách đồ chơi */}
        <Container className="mt-4">
          <h2 className="section-title">Đồ chơi đề xuất</h2>
          <Row>
            {toyList.map((toy) => (
              <Col key={toy.id} xs={12} md={4} className="mb-4">
                <Card
                  className="toy-card"
                  onClick={() => handleNavigateToDetail(toy.id)}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Img
                    variant="top"
                    src={toy.image}
                    className="toy-image"
                  />
                  <Card.Body>
                    <Card.Title className="toy-name">{toy.name}</Card.Title>
                    <Card.Text className="toy-price">{toy.price}</Card.Text>
                    <Card.Text className="toy-status">
                      <strong>Trạng thái: </strong>
                      <span
                        className={
                          toy.status === "Còn trống"
                            ? "available"
                            : "unavailable"
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
                      <a
                        className="ms-2"
                        href="/userdetail"
                        id="trangcanhanlink"
                      >
                        Trang cá nhân người cho mượn
                      </a>
                    </div>
                    <div className="toy-actions d-flex justify-content-between">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleOpenBorrowModal(toy.id)}
                      >
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
          <Footer />
        </Container>

        {/* Modal mượn đồ chơi */}
        <Modal show={showBorrowModal} onHide={handleCloseBorrowModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Nhập thông tin mượn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="borrowStartDate" className="mb-3">
                <Form.Label>Ngày bắt đầu mượn</Form.Label>
                <DatePicker
                  selected={borrowStart}
                  onChange={(date) => setBorrowStart(date)}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  placeholderText="Chọn ngày bắt đầu"
                />
              </Form.Group>
              <Form.Group controlId="borrowEndDate" className="mb-3">
                <Form.Label>Ngày kết thúc mượn</Form.Label>
                <DatePicker
                  selected={borrowEnd}
                  onChange={(date) => setBorrowEnd(date)}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  placeholderText="Chọn ngày kết thúc"
                />
              </Form.Group>
              <Form.Group controlId="borrowNote">
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseBorrowModal}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={handleSendRequest}>
              Gửi yêu cầu
            </Button>
          </Modal.Footer>
        </Modal>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
      <div className="side-banner right-banner">
        <img src={banner_test2} alt="Right Banner" />
      </div>
    </div>
  );
};

export default Home;
