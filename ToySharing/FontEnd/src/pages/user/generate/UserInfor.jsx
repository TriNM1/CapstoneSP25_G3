import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Collapse,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFilter } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import toy1 from "../../../assets/toy1.jpg";
import userAvatar from "../../../assets/user.png";
import "./UserInfor.scss";
import Footer from "../../../components/footer";

const UserInfor = () => {
  const navigate = useNavigate();

  // State cho header active link
  const [activeLink, setActiveLink] = useState("user-info");

  // Dữ liệu thông tin người dùng
  const userInfo = {
    avatar: userAvatar,
    name: "Nguyễn Văn A",
    age: 30,
    distance: 2.5, // km
    address: "123 Đường ABC, Quận 1, TP.HCM",
    reputation: 97, // số uy tín
  };

  // Bộ lọc giống trang SearchToy
  const [showFilter, setShowFilter] = useState(false);
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [brand, setBrand] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    console.log({
      color,
      condition,
      category,
      ageRange,
      brand,
      distance: distanceFilter,
    });
    // Tích hợp logic lọc nếu cần
  };

  // Dữ liệu mẫu cho các đồ chơi của người dùng
  const [toyList, setToyList] = useState([
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      status: "Còn trống",
      price: "50,000 VND",
    },
    {
      id: 2,
      image: toy1,
      name: "Robot chơi",
      status: "Hết đồ",
      price: "70,000 VND",
    },
    {
      id: 3,
      image: toy1,
      name: "Búp bê Barbie",
      status: "Còn trống",
      price: "60,000 VND",
    },
    {
      id: 4,
      image: toy1,
      name: "Khối xếp hình",
      status: "Còn trống",
      price: "40,000 VND",
    },
  ]);

  // State cho Modal nhập thông tin mượn
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

  return (
    <div className="user-infor-page home-page">
      {/* Header dùng chung */}
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />

      <Container className="mt-4">
        {/* Phần thông tin chung của người dùng */}
        <Row className="user-info-section mb-4 align-items-center">
          <Col xs={12} md={4} className="text-center">
            <img
              src={userInfo.avatar}
              alt="User Avatar"
              className="user-avatar"
            />
          </Col>
          <Col xs={12} md={8}>
            <Row className="user-details">
              <Col xs={12} sm={6}>
                <p>
                  <strong>Tên:</strong> {userInfo.name}
                </p>
              </Col>
              <Col xs={12} sm={6}>
                <p>
                  <strong>Tuổi:</strong> {userInfo.age}
                </p>
              </Col>
              <Col xs={12} sm={6}>
                <p>
                  <strong>Khoảng cách:</strong> {userInfo.distance} km
                </p>
              </Col>
              <Col xs={12} sm={6}>
                <p>
                  <strong>Địa chỉ:</strong> {userInfo.address}
                </p>
              </Col>
              <Col xs={12} sm={6}>
                <p>
                  <strong>Uy tín:</strong>{" "}
                  <span
                    className={`reputation ${
                      userInfo.reputation > 95 ? "high" : ""
                    }`}
                  >
                    {userInfo.reputation}
                  </span>
                </p>
              </Col>
            </Row>
            <div className="user-actions mt-3">
              <Button
                variant="primary"
                onClick={() => alert("Chức năng đánh giá sắp ra mắt!")}
              >
                Đánh giá
              </Button>
              <Button
                variant="secondary"
                className="ms-2"
                onClick={() => navigate("/message")}
              >
                Nhắn tin
              </Button>
            </div>
          </Col>
        </Row>

        {/* Phần bộ lọc */}
        <Row className="mb-3">
          <Col xs={12}>
            <Button
              variant="outline-secondary"
              onClick={() => setShowFilter(!showFilter)}
            >
              {showFilter ? "Đóng bộ lọc" : "Mở bộ lọc"}
            </Button>
            <Collapse in={showFilter}>
              <div className="filter-panel mt-3">
                <Form onSubmit={handleFilterSubmit}>
                  <Row>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterColor">
                        <Form.Label>Màu sắc</Form.Label>
                        <Form.Control
                          as="select"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                        >
                          <option value="">Chọn màu sắc</option>
                          <option value="red">Đỏ</option>
                          <option value="blue">Xanh dương</option>
                          <option value="green">Xanh lá</option>
                          <option value="yellow">Vàng</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterCondition">
                        <Form.Label>Tình trạng</Form.Label>
                        <Form.Control
                          as="select"
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                        >
                          <option value="">Chọn tình trạng</option>
                          <option value="new">Mới</option>
                          <option value="used">Cũ</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterCategory">
                        <Form.Label>Danh mục</Form.Label>
                        <Form.Control
                          as="select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Chọn danh mục</option>
                          <option value="xe">Xe</option>
                          <option value="robot">Robot</option>
                          <option value="bupbe">Búp bê</option>
                          <option value="khixep">Khối xếp hình</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterAgeRange">
                        <Form.Label>Độ tuổi</Form.Label>
                        <Form.Control
                          as="select"
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                        >
                          <option value="">Chọn độ tuổi</option>
                          <option value="0-3">0-3</option>
                          <option value="4-6">4-6</option>
                          <option value="7-9">7-9</option>
                          <option value="10+">10+</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterBrand">
                        <Form.Label>Thương hiệu</Form.Label>
                        <Form.Control
                          as="select"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        >
                          <option value="">Chọn thương hiệu</option>
                          <option value="brandA">Brand A</option>
                          <option value="brandB">Brand B</option>
                          <option value="brandC">Brand C</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterDistance">
                        <Form.Label>Khoảng cách</Form.Label>
                        <Form.Control
                          as="select"
                          value={distanceFilter}
                          onChange={(e) => setDistanceFilter(e.target.value)}
                        >
                          <option value="">Chọn khoảng cách</option>
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="15">15 km</option>
                          <option value="20">20 km</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" type="submit">
                    Áp dụng bộ lọc
                  </Button>
                </Form>
              </div>
            </Collapse>
          </Col>
        </Row>

        {/* Phần danh sách đồ chơi (3 item/1 dòng) */}
        <Row className="toy-items-section">
          {toyList.map((toy) => (
            <Col key={toy.id} xs={12} md={4} className="mb-4">
              <Card className="toy-card">
                <Card.Img variant="top" src={toy.image} className="toy-image" />
                <Card.Body className="text-center">
                  <Card.Title className="toy-name">{toy.name}</Card.Title>
                  <Card.Text className="toy-status">
                    <strong>Trạng thái:</strong>{" "}
                    <span
                      className={
                        toy.status === "Còn trống" ? "available" : "unavailable"
                      }
                    >
                      {toy.status}
                    </span>
                  </Card.Text>
                  <Card.Text className="toy-price">
                    <strong>Giá:</strong> {toy.price}
                  </Card.Text>
                  <div className="toy-actions">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleOpenBorrowModal(toy.id)}
                    >
                      Mượn
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
        <Footer/>
      </Container>

      {/* Modal Nhập thông tin mượn */}
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

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UserInfor;
