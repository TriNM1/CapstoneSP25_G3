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
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./SendingRequest.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../../components/footer";

// Ví dụ dữ liệu mẫu cho các yêu cầu gửi
const initialRequests = [
  {
    id: 1,
    image: "https://via.placeholder.com/300x200?text=Toy+1",
    name: "Xe đua mini",
    sendDate: "2023-07-10",
    borrowDate: "2023-07-15",
    returnDate: "2023-07-20",
    lenderAvatar: "https://via.placeholder.com/50?text=Avatar1",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/300x200?text=Toy+2",
    name: "Robot chơi",
    sendDate: "2023-07-11",
    borrowDate: "2023-07-16",
    returnDate: "2023-07-21",
    lenderAvatar: "https://via.placeholder.com/50?text=Avatar2",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/300x200?text=Toy+3",
    name: "Búp bê Barbie",
    sendDate: "2023-07-12",
    borrowDate: "2023-07-17",
    returnDate: "2023-07-22",
    lenderAvatar: "https://via.placeholder.com/50?text=Avatar3",
  },
  {
    id: 4,
    image: "https://via.placeholder.com/300x200?text=Toy+4",
    name: "Khối xếp hình",
    sendDate: "2023-07-13",
    borrowDate: "2023-07-18",
    returnDate: "2023-07-23",
    lenderAvatar: "https://via.placeholder.com/50?text=Avatar4",
  },
];

const SendingRequest = () => {
  const [activeLink, setActiveLink] = useState("sending-request");
  const [selectedDate, setSelectedDate] = useState(null);
  const [requests, setRequests] = useState(initialRequests);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Khi bấm nút Hủy trên một yêu cầu
  const handleCancelClick = (id) => {
    setSelectedRequestId(id);
    setShowCancelModal(true);
  };

  // Xác nhận hủy yêu cầu: loại bỏ item khỏi danh sách và hiện toast
  const handleConfirmCancel = () => {
    setRequests((prev) => prev.filter((req) => req.id !== selectedRequestId));
    toast.success("Hủy yêu cầu thành công!");
    setShowCancelModal(false);
    setSelectedRequestId(null);
  };

  // Có thể thêm nút "Xem thêm" để tải thêm item (ví dụ: giả định thêm 2 item)
  const handleLoadMore = () => {
    // Đây là ví dụ giả định, bạn có thể tích hợp gọi API
    setRequests([...requests, ...initialRequests.slice(0, 2)]);
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
            <SideMenu
              menuItems={[
                { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
                { id: 2, label: "Danh sách mượn", link: "/listborrowrequest" },
                { id: 3, label: "Lịch sử trao đổi", link: "/transferhistory" },
              ]}
              activeItem={2}
            />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* DatePicker để chọn ngày (giả sử lọc theo ngày gửi yêu cầu) */}
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
              {requests.map((request) => (
                <Col key={request.id} xs={12} md={6} className="mb-4">
                  <Card className="request-card">
                    <Card.Img
                      variant="top"
                      src={request.image}
                      className="toy-image"
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">
                        {request.name}
                      </Card.Title>
                      <Card.Text className="send-date">
                        <strong>Ngày gửi:</strong> {request.sendDate}
                      </Card.Text>
                      <Card.Text className="borrow-date">
                        <strong>Ngày mượn:</strong> {request.borrowDate}
                      </Card.Text>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong> {request.returnDate}
                      </Card.Text>
                      <div className="lender-info d-flex align-items-center mb-2">
                        <img
                          src={request.lenderAvatar}
                          alt="Lender Avatar"
                          className="lender-avatar"
                        />
                        <a href="/userinfo" className="ms-2 lender-link">
                          Trang cá nhân người cho mượn
                        </a>
                      </div>
                      <div className="request-actions text-center">
                        <Button
                          variant="danger"
                          onClick={() => handleCancelClick(request.id)}
                        >
                          Hủy
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
        <Footer/>
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
        <Modal.Body>Bạn có chắc chắn muốn hủy yêu cầu này không?</Modal.Body>
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
