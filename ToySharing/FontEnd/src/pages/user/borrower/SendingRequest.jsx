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
  const [cancelReason, setCancelReason] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showPickedUpModal, setShowPickedUpModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const API_BASE_URL = "https://localhost:7128/api";

  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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

        const formattedRequests = response.data.map((req) => ({
          requestId: req.requestId,
          productId: req.productId,
          productName: req.productName,
          ownerId: req.ownerId || null,
          ownerName: req.ownerName || "Không xác định",
          ownerAvatar: req.ownerAvatar,
          borrowDate: req.borrowDate,
          returnDate: req.returnDate,
          requestDate: req.requestDate || new Date().toISOString(),
          message: req.message,
          status: req.status,
          image: req.image,
        }));

        setRequests(formattedRequests);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu cầu:", error);
        toast.error("Không thể tải danh sách yêu cầu!");
        setRequests([]);
      }
    };

    fetchRequests();
  }, [navigate]);

  const handleViewProfile = async (ownerId) => {
    if (!ownerId) {
      toast.error("Không có thông tin người cho mượn!");
      return;
    }
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/User/profile/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfileData(response.data.userInfo);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const handleCancelClick = (id) => {
    setSelectedRequestId(id);
    setShowCancelModal(true);
  };

  const handlePickedUpClick = (id) => {
    setSelectedRequestId(id);
    setShowPickedUpModal(true);
  };

  const handleCompleteClick = (id) => {
    setSelectedRequestId(id);
    setShowCompleteModal(true);
  };

  const handleConfirmPickedUp = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/${selectedRequestId}/picked-up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === selectedRequestId ? { ...req, status: 2 } : req
        )
      );
      toast.success("Đã đánh dấu yêu cầu là đã lấy!");
      setShowPickedUpModal(false);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã lấy:", error);
      let errorMessage = "Không thể đánh dấu đã lấy!";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
          navigate("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (error.response.status === 404) {
          errorMessage = "Yêu cầu không tồn tại!";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Yêu cầu không hợp lệ!";
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleConfirmComplete = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/history/${selectedRequestId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) =>
        prev.filter((req) => req.requestId !== selectedRequestId)
      );
      toast.success("Đã hoàn thành yêu cầu thành công!");
      setShowCompleteModal(false);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Lỗi khi hoàn thành yêu cầu:", error);
      let errorMessage = "Không thể hoàn thành yêu cầu!";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
          navigate("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (error.response.status === 404) {
          errorMessage = "Yêu cầu hoặc lịch sử không tồn tại!";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Yêu cầu không hợp lệ!";
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      toast.error("Vui lòng nhập lý do hủy yêu cầu!");
      return;
    }

    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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

  const handleLoadMore = () => {
    toast.info("Đã hiển thị tất cả yêu cầu!");
  };

  const filteredRequests = selectedDate
    ? requests.filter((request) => {
        const requestDate = new Date(request.borrowDate);
        return (
          (request.status === 1 || request.status === 2) &&
          requestDate.getDate() === selectedDate.getDate() &&
          requestDate.getMonth() === selectedDate.getMonth() &&
          requestDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : requests.filter((request) => request.status === 1 || request.status === 2);

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
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={2} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <Form.Group controlId="selectDate" className="mb-3">
              <Form.Label>Chọn ngày mượn</Form.Label>
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
                      src={request.image}
                      className="toy-image"
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">{request.productName}</Card.Title>
                      <Card.Text className="send-date">
                        <strong>Ngày gửi:</strong>{" "}
                        {request.requestDate
                          ? new Date(request.requestDate).toLocaleDateString()
                          : "Không xác định"}
                      </Card.Text>
                      <Card.Text className="borrow-date">
                        <strong>Ngày mượn:</strong>{" "}
                        {new Date(request.borrowDate).toLocaleDateString()}
                      </Card.Text>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong>{" "}
                        {new Date(request.returnDate).toLocaleDateString()}
                      </Card.Text>
                      <Card.Text className="status">
                        <strong>Trạng thái:</strong>{" "}
                        <span>
                          {request.status === 1 ? "Chấp nhận, chưa lấy" : "Đã lấy"}
                        </span>
                      </Card.Text>
                      <div className="lender-info d-flex align-items-center mb-2">
                        <img
                          src={request.ownerAvatar}
                          alt="Ảnh đại diện người cho mượn"
                          className="lender-avatar"
                        />
                        <Button
                          variant="link"
                          className="ms-2 lender-link p-0 text-decoration-none"
                          onClick={() => handleViewProfile(request.ownerId)}
                        >
                          Thông tin người cho mượn
                        </Button>
                      </div>
                      <div className="request-actions text-center">
                        {request.status === 1 && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => handlePickedUpClick(request.requestId)}
                              className="me-2"
                            >
                              Đã lấy
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleCancelClick(request.requestId)}
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                        {request.status === 2 && (
                          <Button
                            variant="success"
                            onClick={() => handleCompleteClick(request.requestId)}
                          >
                            Đã trả
                          </Button>
                        )}
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

      <Modal
        show={showPickedUpModal}
        onHide={() => setShowPickedUpModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đã lấy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn đã lấy đồ chơi này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPickedUpModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmPickedUp}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCompleteModal}
        onHide={() => setShowCompleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hoàn thành</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn đã trả đồ chơi này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmComplete}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người cho mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={profileData.avatar || "https://via.placeholder.com/100"}
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px" }}
              />
              <p><strong>Tên hiển thị:</strong> {profileData.displayName || "Không có tên"}</p>
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

export default SendingRequest;