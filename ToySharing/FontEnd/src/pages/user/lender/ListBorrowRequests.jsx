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
import { FaBars } from "react-icons/fa";
import Header from "../../../components/Header";
import toy1 from "../../../assets/toy1.jpg";
import user from "../../../assets/user.png";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./ListBorrowRequests.scss";

const ListBorrowRequests = () => {
  const unreadMessages = 3;
  const notificationCount = 2;
  const [activeLink, setActiveLink] = useState("muon-do-choi");

  // Dữ liệu yêu cầu mượn ban đầu (fix cứng 4 mục, thêm requesterId thay vì userId để rõ ràng hơn)
  const initialRequests = [
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      price: "50,000 VND",
      requestDate: "2023-07-01",
      borrowDate: "2023-07-05",
      returnDate: "2023-07-10",
      requesterId: 1, // Giả lập ID người mượn
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
      requesterId: 2,
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
      requesterId: 3,
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
      requesterId: 4,
      requesterAvatar: user,
      message: "Khối xếp hình giúp tôi phát triển tư duy logic.",
    },
  ];

  // State quản lý danh sách yêu cầu
  const [requests, setRequests] = useState(initialRequests);
  const [filterDate, setFilterDate] = useState(null);
  const [visibleItems, setVisibleItems] = useState(4);

  // State cho Modal hiển thị lời nhắn
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // State cho Modal xác nhận hành động
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // State cho Modal hiển thị profile
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Gọi API để lấy dữ liệu yêu cầu mượn
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://localhost:7128/api/Requests/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const formattedRequests = response.data.map((req) => ({
          id: req.requestId,
          image: req.image || toy1,
          name: req.productName,
          price: `${req.price.toLocaleString("vi-VN")} VND`,
          requestDate: new Date(req.requestDate).toISOString().split("T")[0],
          borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
          returnDate: new Date(req.returnDate).toISOString().split("T")[0],
          requesterId: req.userId, // Sử dụng userId từ API làm requesterId
          requesterAvatar: req.borrowerAvatar || user,
          message: req.message,
        }));
        setRequests([...initialRequests, ...formattedRequests]);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Không thể tải dữ liệu từ API!");
        setRequests(initialRequests);
      }
    };

    fetchRequests();
  }, []);

  const handleLoadMore = () => {
    setVisibleItems(visibleItems + 3);
  };

  const formattedFilterDate = filterDate
    ? filterDate.toISOString().split("T")[0]
    : "";

  const filteredRequests = formattedFilterDate
    ? requests.filter((item) => item.requestDate === formattedFilterDate)
    : requests;

  const visibleRequests = filteredRequests.slice(0, visibleItems);

  const handleViewMessage = (message) => {
    setModalMessage(message);
    setShowMessageModal(true);
  };

  const handleConfirmAction = (action, id) => {
    setConfirmAction(action);
    setSelectedRequestId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      const actionUrl = `https://localhost:7128/api/Requests/${selectedRequestId}/status`;
      const newStatus = confirmAction === "accept" ? 1 : 2;
      await axios.put(
        actionUrl,
        { newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
      toast.success(
        confirmAction === "accept"
          ? "Chấp nhận yêu cầu thành công!"
          : "Từ chối yêu cầu thành công!"
      );
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("Có lỗi xảy ra khi xử lý yêu cầu! Chỉ xóa cục bộ.");
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction("");
      setSelectedRequestId(null);
    }
  };

  // Hàm gọi API để lấy thông tin profile người mượn
  const handleViewProfile = async (requesterId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://localhost:7128/api/User/profile/${requesterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileData(response.data.userInfo); // Lấy userInfo từ UserProfileDTO
      setShowProfileModal(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Không thể tải thông tin người dùng!");
    }
  };

  return (
    <div className="list-borrow-requests-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={unreadMessages}
        notificationCount={notificationCount}
      />

      <Container fluid>
        <Row>
          <Col xs={12} md={2}>
            <SideMenu
              menuItems={[
                { id: 1, label: "Đăng Tải Đồ Chơi Mới", link: "/addtoy" },
                { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
                { id: 3, label: "Đang cho mượn", link: "/inlending" },
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
                      <Card.Title className="toy-name">{request.name}</Card.Title>
                      <Card.Text className="toy-price">{request.price}</Card.Text>
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
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => handleViewProfile(request.requesterId)}
                          >
                            Trang cá nhân người muốn mượn
                          </Button>
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
                          onClick={() => handleConfirmAction("accept", request.id)}
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleConfirmAction("decline", request.id)}
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

      {/* Modal xác nhận hành động */}
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

      {/* Modal hiển thị thông tin profile */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={profileData.avatar || user}
                alt="Avatar"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px" }}
              />
              <p><strong>Tên:</strong> {profileData.name}</p>
              <p><strong>Tuổi:</strong> {profileData.age}</p>
              <p><strong>Địa chỉ:</strong> {profileData.address}</p>
              <p><strong>Đánh giá:</strong> {profileData.rating.toFixed(2)}</p>
            </div>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProfileModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ListBorrowRequests;