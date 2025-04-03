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
import user from "../../../assets/user.png";
import "./SearchingToy.scss";
import Footer from "../../../components/footer";

const SearchingToy = () => {
  // Hook dùng để điều hướng
  const navigate = useNavigate();

  // State cho header và active nav link
  const [activeLink, setActiveLink] = useState("searching-toy");

  // State để hiển thị/ẩn bộ lọc
  const [showFilter, setShowFilter] = useState(false);

  // Các state cho bộ lọc
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [brand, setBrand] = useState("");
  const [distance, setDistance] = useState("");

  // Các link cho side menu
  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // Dữ liệu mẫu cho các đồ chơi chuyển thành state để có thể cập nhật khi gửi yêu cầu mượn
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

  // State cho Modal nhập thông tin mượn
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  // Lưu lại id của item được chọn
  const [selectedToyId, setSelectedToyId] = useState(null);

  // Hàm xử lý khi submit bộ lọc
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    console.log({ color, condition, category, ageRange, brand, distance });
  };

  // Mở Modal mượn đồ chơi, lưu lại id của item được chọn
  const handleOpenBorrowModal = (toyId) => {
    setSelectedToyId(toyId);
    setShowBorrowModal(true);
  };

  const handleCloseBorrowModal = () => {
    setShowBorrowModal(false);
    // Reset lại thông tin nhập nếu cần
    setBorrowStart(null);
    setBorrowEnd(null);
    setNote("");
    setSelectedToyId(null);
  };

  // Xử lý gửi yêu cầu mượn, ẩn item và hiển thị toast success
  const handleSendRequest = () => {
    console.log({ borrowStart, borrowEnd, note, selectedToyId });
    // Loại bỏ item có id = selectedToyId khỏi danh sách
    setToyList((prevList) =>
      prevList.filter((toy) => toy.id !== selectedToyId)
    );
    // Hiển thị thông báo thành công
    toast.success("Gửi yêu cầu mượn thành công!");
    // Đóng modal sau khi gửi yêu cầu
    handleCloseBorrowModal();
  };

  return (
    <div className="searching-toy-page home-page">
      {/* Header dùng chung */}
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />

      <Container fluid>
        <Row>
          {/* Side Menu */}
          <Col xs={12} md={2} className="side-menu">
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={9} className="main-content">
            {/* Nút bật/tắt bộ lọc */}
            <div className="filter-toggle mb-3">
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilter(!showFilter)}
              >
                <FaFilter /> Bộ lọc
              </Button>
            </div>

            {/* Bộ lọc ẩn (Collapse) */}
            <Collapse in={showFilter}>
              <div className="filter-panel mb-4">
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
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
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

            {/* Hiển thị danh sách đồ chơi */}
            <Row>
              {toyList.map((toy) => (
                <Col key={toy.id} xs={12} md={6} className="mb-4">
                  <Card className="toy-card">
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
                          href="/userinfor"
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
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={() => navigate("/message")}
                        >
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
          </Col>
        </Row>
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

      {/* Toast Container hiển thị thông báo thành công */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SearchingToy;
