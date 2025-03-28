import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaStar, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./InLending.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import toy1 from "../../../assets/toy1.jpg";

const InLending = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("lending");

  const sideMenuItems = [
    { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // DatePicker state
  const [selectedDate, setSelectedDate] = useState(null);

  // Dữ liệu mẫu cho giao dịch cho mượn
  const initialLendings = [
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      borrowDate: "2023-07-01",
      returnDate: "2023-07-10",
      lenderAvatar: toy1,
    },
    {
      id: 2,
      image: toy1,
      name: "Robot chơi",
      borrowDate: "2023-07-02",
      returnDate: "2023-07-11",
      lenderAvatar: toy1,
    },
    {
      id: 3,
      image: toy1,
      name: "Búp bê Barbie",
      borrowDate: "2023-07-03",
      returnDate: "2023-07-12",
      lenderAvatar: toy1,
    },
    {
      id: 4,
      image: toy1,
      name: "Khối xếp hình",
      borrowDate: "2023-07-04",
      returnDate: "2023-07-13",
      lenderAvatar: toy1,
    },
    {
      id: 5,
      image: toy1,
      name: "Xe điều khiển",
      borrowDate: "2023-07-05",
      returnDate: "2023-07-14",
      lenderAvatar: toy1,
    },
    {
      id: 6,
      image: toy1,
      name: "Đồ chơi xếp hình",
      borrowDate: "2023-07-06",
      returnDate: "2023-07-15",
      lenderAvatar: toy1,
    },
  ];

  const [lendings, setLendings] = useState(initialLendings);

  // --- Modal đánh giá người mượn ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleReturn = (id) => {
    // Khi bấm "Đã trả", mở modal đánh giá
    setShowRatingModal(true);
  };

  const handleSendRating = () => {
    console.log({ rating, reviewText });
    toast.success("Đã gửi đánh giá thành công!");
    setShowRatingModal(false);
    setRating(0);
    setHoverRating(0);
    setReviewText("");
  };

  // --- Modal báo cáo ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);

  const handleReport = (id) => {
    setSelectedReportId(id);
    setShowReportModal(true);
  };

  const handleSendReport = () => {
    setLendings((prev) => prev.filter((item) => item.id !== selectedReportId));
    toast.success("Gửi báo cáo thành công!");
    setShowReportModal(false);
    setReportReason("");
    setSelectedReportId(null);
  };

  // Xử lý nút Nhắn tin: chuyển đến trang /message
  const handleMessage = (id) => {
    navigate("/message");
  };

  const handleLoadMore = () => {
    // Giả định: thêm 3 item nữa
    setLendings([...lendings, ...initialLendings.slice(0, 3)]);
  };

  return (
    <div className="inlending-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={3} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <Form.Group controlId="selectDate" className="mb-3">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Tìm kiếm theo ngày"
              />
            </Form.Group>
            <Row className="lending-items-section">
              {lendings.map((item) => (
                <Col key={item.id} xs={12} md={6} className="mb-4">
                  <Card className="lending-card">
                    <Card.Img
                      variant="top"
                      src={item.image}
                      className="toy-image"
                    />
                    <Card.Body className="text-center">
                      <Card.Title className="toy-name">{item.name}</Card.Title>
                      <Card.Text className="borrow-date">
                        <strong>Ngày mượn:</strong> {item.borrowDate}
                      </Card.Text>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong> {item.returnDate}
                      </Card.Text>
                      <Card.Text className="lending-status">
                        <strong>Trạng thái:</strong>{" "}
                        <span className="in-progress">Đang cho mượn</span>
                      </Card.Text>
                      <div className="lending-actions">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => handleMessage(item.id)}
                        >
                          Nhắn tin
                        </Button>
                      </div>
                      <div className="lender-info mt-2 d-flex align-items-center justify-content-center">
                        <img
                          src={item.lenderAvatar}
                          alt="Avatar"
                          className="lender-avatar"
                        />
                        <a href="/userinfor" className="ms-2 lender-link">
                          Trang chủ người mượn
                        </a>
                      </div>
                      <div className="lending-buttons mt-3">
                        <Button
                          variant="success"
                          size="lg"
                          onClick={() => handleReturn(item.id)}
                        >
                          Đã trả
                        </Button>
                        <Button
                          variant="danger"
                          size="lg"
                          className="ms-2"
                          onClick={() => handleReport(item.id)}
                        >
                          Báo cáo
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            <div className="text-center">
              <Button
                variant="outline-primary"
                className="view-more-btn"
                onClick={handleLoadMore}
              >
                Xem thêm
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modal đánh giá người mượn */}
      <Modal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá người mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="ratingStars" className="mb-3">
              <Form.Label>Đánh giá sao</Form.Label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      cursor: "pointer",
                      color:
                        star <= (hoverRating || rating) ? "#ffc107" : "#ddd",
                      fontSize: "1.5rem",
                      marginRight: "5px",
                    }}
                  >
                    <FaStar />
                  </span>
                ))}
              </div>
            </Form.Group>
            <Form.Group controlId="reviewText">
              <Form.Label>Đánh giá</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập đánh giá của bạn"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendRating}>
            <FaPaperPlane className="me-2" /> Gửi đánh giá
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal báo cáo */}
      <Modal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Báo cáo đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="reportReason" className="mb-3">
              <Form.Label>Nhập lý do báo cáo</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lý do báo cáo"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendReport}>
            <FaPaperPlane className="me-2" /> Gửi báo cáo
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default InLending;
