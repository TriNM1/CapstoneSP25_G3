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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ListBorrowRequests.scss";
import Footer from "../../../components/footer";

const ListBorrowRequests = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("muon-do-choi");
  const [requests, setRequests] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [visibleItems, setVisibleItems] = useState(4);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  const fetchRequests = async () => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem danh sách yêu cầu mượn!");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Requests/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedRequests = response.data.map((req) => ({
        id: req.requestId,
        image: req.image || "https://via.placeholder.com/300x200?text=No+Image",
        name: req.productName,
        price: `${req.price.toLocaleString("vi-VN")} VND`,
        requestDate: new Date(req.requestDate).toISOString().split("T")[0],
        borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
        returnDate: new Date(req.returnDate).toISOString().split("T")[0],
        requesterId: req.userId,
        requesterAvatar: req.borrowerAvatar,
        message: req.message,
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu yêu cầu mượn:", error);
      toast.error("Không thể tải dữ liệu từ API!");
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();

    const timer = setTimeout(() => {
      fetchRequests();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const formattedFilterDate = filterDate
    ? filterDate.toISOString().split("T")[0]
    : "";
  const filteredRequests = formattedFilterDate
    ? requests.filter((item) => item.requestDate === formattedFilterDate)
    : requests;
  const visibleRequests = filteredRequests.slice(0, visibleItems);

  const handleViewMessage = (message) => {
    setModalMessage(message || "");
    setShowMessageModal(true);
  };

  const handleConfirmAction = (action, id) => {
    setConfirmAction(action);
    setSelectedRequestId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      const actionUrl = `${API_BASE_URL}/Requests/${selectedRequestId}/status`;
      const newStatus = confirmAction === "accept" ? 1 : 4;
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
      console.error("Lỗi khi xử lý yêu cầu:", error);
      toast.error("Có lỗi xảy ra khi xử lý yêu cầu!");
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction("");
      setSelectedRequestId(null);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      const response = await axios.get(`${API_BASE_URL}/User/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileData(response.data.userInfo);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người mượn:", error);
      toast.error("Không thể tải thông tin người mượn!");
    }
  };

  return (
    <div className="list-borrow-requests-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />

      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu
              menuItems={[
                { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
                { id: 3, label: "Đang cho mượn", link: "/inlending" },
                { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
                { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
              ]}
              activeItem={4}
            />
          </Col>

          <Col xs={12} md={10} className="main-content">
            <Form.Group controlId="filterDate" className="mb-3">
              <Form.Label>Chọn ngày gửi yêu cầu</Form.Label>
              <DatePicker
                selected={filterDate}
                onChange={(date) => setFilterDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Chọn ngày"
                className="date-picker-input"
              />
            </Form.Group>

            {requests.length === 0 ? (
              <div className="text-center mt-5">
                <h5>Không có yêu cầu mượn nào</h5>
              </div>
            ) : (
              <>
                <Row className="lending-items-section">
                  {visibleRequests.map((request) => (
                    <Col key={request.id} xs={12} md={6} className="mb-4">
                      <Card className="borrow-request-card">
                        <Card.Img
                          variant="top"
                          src={request.image}
                          className="toy-image"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
                        />
                        <Card.Body className="card-body">
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
                          <div className="lender-info">
                            <img
                              src={request.requesterAvatar || "https://via.placeholder.com/50?text=Avatar"}
                              alt="Ảnh đại diện người mượn"
                              className="requester-avatar"
                              onError={(e) => (e.target.src = "https://via.placeholder.com/50?text=Avatar")}
                            />
                            <span>
                              <Button
                                variant="link"
                                className="requester-link p-0 text-decoration-none"
                                onClick={() => handleViewProfile(request.requesterId)}
                              >
                                Thông tin người mượn
                              </Button>
                            </span>
                          </div>
                          <div className="card-actions">
                            <div className="d-flex justify-content-center mb-3">
                              <Button
                                variant="secondary"
                                onClick={() => handleViewMessage(request.message)}
                                style={{ width: "150px" }}
                              >
                                Xem lời nhắn
                              </Button>
                            </div>
                            <div className="d-flex justify-content-center gap-3">
                              <Button
                                variant="success"
                                onClick={() => handleConfirmAction("accept", request.id)}
                                style={{ width: "120px" }}
                              >
                                Chấp nhận
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleConfirmAction("decline", request.id)}
                                style={{ width: "120px" }}
                              >
                                Từ chối
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {visibleRequests.length < filteredRequests.length && (
                  <div className="text-center">
                    <Button variant="outline-primary" className="view-more-btn" onClick={handleLoadMore}>
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
        <Footer />
      </Container>

      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Lời nhắn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalMessage ? (
            <p>{modalMessage}</p>
          ) : (
            <p style={{ opacity: 0.5, color: "#666" }}>Không có lời nhắn</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmAction === "accept"
            ? "Bạn có chắc chắn muốn chấp nhận yêu cầu mượn này?"
            : "Bạn có chắc chắn muốn từ chối yêu cầu mượn này?"}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={profileData.avatar || "https://via.placeholder.com/100?text=Avatar"}
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=Avatar")}
              />
              <p><strong>Tên:</strong> {profileData.displayName || "Không có tên"}</p>
              <p><strong>Tuổi:</strong> {profileData.age || "Không có thông tin"}</p>
              <p><strong>Địa chỉ:</strong> {profileData.address || "Không có thông tin"}</p>
              <p><strong>Đánh giá:</strong> {profileData.rating ? profileData.rating.toFixed(2) : "Chưa có đánh giá"}</p>
            </div>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ListBorrowRequests;