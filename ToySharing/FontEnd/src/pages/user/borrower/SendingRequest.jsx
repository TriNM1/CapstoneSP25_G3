import React, { useState, useEffect } from "react";
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
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./SendingRequest.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SendingRequest = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("sending-request");
  const [selectedDate, setSelectedDate] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [cancelReason, setCancelReason] = useState(""); // Lý do hủy yêu cầu

  const API_BASE_URL = "https://localhost:7128/api";

  // Side Menu Items
  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  // Lấy danh sách yêu cầu mượn từ API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const token = sessionToken || localToken;
        if (!token) {
          toast.error("Vui lòng đăng nhập để xem danh sách yêu cầu!");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Requests/toy-request`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRequests(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu cầu:", error);
        toast.error("Không thể tải danh sách yêu cầu!");
        setRequests([]);
      }
    };

    fetchRequests();
  }, [navigate]);

  // Lọc yêu cầu theo ngày (nếu có)
  const filteredRequests = selectedDate
    ? requests.filter((request) => {
      const requestDate = new Date(request.requestDate);
      return (
        requestDate.getDate() === selectedDate.getDate() &&
        requestDate.getMonth() === selectedDate.getMonth() &&
        requestDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    : requests;

  // Khi bấm nút Hủy trên một yêu cầu
  const handleCancelClick = (id) => {
    setSelectedRequestId(id);
    setShowCancelModal(true);
  };

  // Xác nhận hủy yêu cầu
  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      toast.error("Vui lòng nhập lý do hủy yêu cầu!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/Requests/${selectedRequestId}/cancel`,
        { reason: cancelReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Cập nhật danh sách yêu cầu sau khi hủy
      setRequests((prev) => prev.filter((req) => req.requestId !== selectedRequestId));
      toast.success("Hủy yêu cầu thành công!");
      setShowCancelModal(false);
      setSelectedRequestId(null);
      setCancelReason("");
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu:", error);
      toast.error("Không thể hủy yêu cầu!");
    }
  };

  // Xử lý "Xem thêm" (giả lập phân trang, có thể tích hợp API sau)
  const handleLoadMore = () => {
    // Hiện tại API không hỗ trợ phân trang, nên chỉ hiển thị lại dữ liệu
    toast.info("Đã hiển thị tất cả yêu cầu!");
  };

  return (
    <div className="sending-request-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />

      <Container fluid className="mt-4">
        <Row>
          {/* Side Menu */}
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={2} />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* DatePicker để chọn ngày (lọc theo ngày gửi yêu cầu) */}
            <Form.Group controlId="selectDate" className="mb-3">
              <Form.Label>Chọn ngày</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Chọn ngày"
              />
            </Form.Group>
            <Row className="request-items-section">
              {filteredRequests.map((request) => (
                <Col key={request.requestId} xs={12} md={6} className="mb-4">
                  <Card className="request-card">
                    <Card.Img
                      variant="top"
                      src={request.image || "https://via.placeholder.com/300x200?text=No+Image"}
                      className="toy-image"
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">{request.productName}</Card.Title>
                      <Card.Text className="send-date">
                        <strong>Ngày gửi:</strong>{" "}
                        {new Date(request.requestDate).toLocaleDateString()}
                      </Card.Text>
                      <Card.Text className="borrow-date">
                        <strong>Ngày mượn:</strong>{" "}
                        {new Date(request.borrowDate).toLocaleDateString()}
                      </Card.Text>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong>{" "}
                        {new Date(request.returnDate).toLocaleDateString()}
                      </Card.Text>
                      <div className="lender-info d-flex align-items-center mb-2">
                        <img
                          src={
                            request.ownerAvatar ||
                            "https://via.placeholder.com/50?text=Avatar"
                          }
                          alt="Lender Avatar"
                          className="lender-avatar"
                        />
                        <a
                          href={`/userinfo/${request.ownerId}`}
                          className="ms-2 lender-link"
                        >
                          {request.ownerName || "Người cho mượn"}
                        </a>
                      </div>
                      <div className="request-actions text-center">
                        <Button
                          variant="danger"
                          onClick={() => handleCancelClick(request.requestId)}
                        >
                          Hủy
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {filteredRequests.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline-primary"
                  className="view-more-btn"
                  onClick={handleLoadMore}
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal xác nhận hủy yêu cầu */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy yêu cầu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn hủy yêu cầu này không?</p>
          <Form.Group controlId="cancelReason">
            <Form.Label>Lý do hủy</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Nhập lý do hủy yêu cầu"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmCancel}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SendingRequest;