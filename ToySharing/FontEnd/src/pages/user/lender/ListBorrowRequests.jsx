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
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Header from "../../../components/Header";
import toy1 from "../../../assets/toy1.jpg";
import user from "../../../assets/user.png";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ListBorrowRequests.scss";

const ListBorrowRequests = () => {
  const unreadMessages = 3;
  const notificationCount = 2;
  const [activeLink, setActiveLink] = useState("muon-do-choi");

  // Dữ liệu yêu cầu mượn (bao gồm thuộc tính message)
  const initialRequests = [
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      price: "50,000 VND",
      requestDate: "2023-07-01",
      borrowDate: "2023-07-05",
      returnDate: "2023-07-10",
      requesterAvatar: user,
      message: "Tôi muốn mượn xe đua mini vì nó rất thú vị.",
    },
    {
      id: 2,
      image: toy1,
      name: "Robot chơi",
      price: "70,000 VND",
      requestDate: "2023-07-02",
      borrowDate: "2023-07-06",
      returnDate: "2023-07-11",
      requesterAvatar: user,
      message: "Robot chơi sẽ giúp tôi học lập trình cơ bản.",
    },
    {
      id: 3,
      image: toy1,
      name: "Búp bê Barbie",
      price: "60,000 VND",
      requestDate: "2023-07-03",
      borrowDate: "2023-07-07",
      returnDate: "2023-07-12",
      requesterAvatar: user,
      message: "Búp bê Barbie là món đồ chơi ưa thích của tôi từ nhỏ.",
    },
    {
      id: 4,
      image: toy1,
      name: "Khối xếp hình",
      price: "40,000 VND",
      requestDate: "2023-07-04",
      borrowDate: "2023-07-08",
      returnDate: "2023-07-13",
      requesterAvatar: user,
      message: "Khối xếp hình giúp tôi phát triển tư duy logic.",
    },
    {
      id: 5,
      image: toy1,
      name: "Xe điều khiển",
      price: "80,000 VND",
      requestDate: "2023-07-05",
      borrowDate: "2023-07-09",
      returnDate: "2023-07-14",
      requesterAvatar: user,
      message: "Xe điều khiển sẽ làm tôi hào hứng chơi với bạn bè.",
    },
    {
      id: 6,
      image: toy1,
      name: "Đồ chơi xếp hình",
      price: "30,000 VND",
      requestDate: "2023-07-06",
      borrowDate: "2023-07-10",
      returnDate: "2023-07-15",
      requesterAvatar: user,
      message: "Đồ chơi xếp hình giúp tôi rèn luyện khả năng sáng tạo.",
    },
  ];

  // State quản lý danh sách yêu cầu
  const [requests, setRequests] = useState(initialRequests);
  const [filterDate, setFilterDate] = useState(null);
  const [visibleItems, setVisibleItems] = useState(6);

  // State cho Modal hiển thị lời nhắn
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // State cho Modal xác nhận hành động (chấp nhận / từ chối)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(""); // "accept" hoặc "decline"
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const handleLoadMore = () => {
    setVisibleItems(visibleItems + 3);
  };

  // Định dạng ngày nếu có chọn (yyyy-MM-dd)
  const formattedFilterDate = filterDate
    ? filterDate.toISOString().split("T")[0]
    : "";

  const filteredRequests = formattedFilterDate
    ? requests.filter((item) => item.requestDate === formattedFilterDate)
    : requests;

  const visibleRequests = filteredRequests.slice(0, visibleItems);

  // Hiển thị modal lời nhắn
  const handleViewMessage = (message) => {
    setModalMessage(message);
    setShowMessageModal(true);
  };

  // Xử lý xác nhận hành động chấp nhận hoặc từ chối
  const handleConfirmAction = (action, id) => {
    setConfirmAction(action);
    setSelectedRequestId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction === "accept") {
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
      toast.success("Chấp nhận yêu cầu thành công!");
    } else if (confirmAction === "decline") {
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
      toast.success("Từ chối yêu cầu thành công!");
    }
    setShowConfirmModal(false);
    setConfirmAction("");
    setSelectedRequestId(null);
  };

  return (
    <div className="list-borrow-requests-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={notificationCount}
      />

      <Container fluid>
        <Row>
          {/* Side Menu dùng component chung */}
          <Col xs={12} md={2}>
            <SideMenu
              menuItems={[
                { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
                { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
                { id: 3, label: "Đang cho mượn", link: "/lending" },
                {
                  id: 4,
                  label: "Danh sách muốn mượn",
                  link: "/listborrowrequests",
                },
                { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
              ]}
              activeItem={4}
            />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={9} className="main-content">
            <div className="date-filter mb-3">
              <Form.Group controlId="filterDate">
                <Form.Label>Chọn ngày gửi yêu cầu</Form.Label>
                <DatePicker
                  selected={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Chọn ngày"
                  className="date-picker-input"
                />
              </Form.Group>
            </div>

            <Row>
              {visibleRequests.map((request) => (
                <Col key={request.id} xs={12} lg={6} className="mb-4">
                  <Card className="borrow-request-card">
                    <Card.Img
                      variant="top"
                      src={request.image}
                      className="toy-image"
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">
                        {request.name}
                      </Card.Title>
                      <Card.Text className="toy-price">
                        {request.price}
                      </Card.Text>
                      <Card.Text className="request-date">
                        <strong>Ngày gửi yêu cầu:</strong> {request.requestDate}
                      </Card.Text>
                      <Card.Text className="borrow-date">
                        <strong>Ngày mượn:</strong> {request.borrowDate}
                      </Card.Text>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong> {request.returnDate}
                      </Card.Text>
                      <div className="requester-info d-flex align-items-center mb-2">
                        <img
                          src={request.requesterAvatar}
                          alt="Requester Avatar"
                          className="requester-avatar"
                        />
                        <span className="ms-2">
                          <a href="/userinfo">Trang cá nhân người muốn mượn</a>
                        </span>
                      </div>
                      <div className="request-actions d-flex justify-content-between">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewMessage(request.message)}
                        >
                          Xem lời nhắn
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            handleConfirmAction("accept", request.id)
                          }
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleConfirmAction("decline", request.id)
                          }
                        >
                          Từ chối
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {visibleRequests.length < filteredRequests.length && (
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

      {/* Modal hiển thị lời nhắn */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Lời nhắn</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMessageModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận hành động chấp nhận / từ chối */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmAction === "accept"
            ? "Bạn có chắc chắn muốn chấp nhận yêu cầu mượn này?"
            : "Bạn có chắc chắn muốn từ chối yêu cầu mượn này?"}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ListBorrowRequests;
