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
import "./BorrowHistory.scss";

const BorrowHistory = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("transfer-history");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [histories, setHistories] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [mainUserId, setMainUserId] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "1", label: "Hoàn thành" },
    { value: "2", label: "Đã hủy" },
  ];

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem lịch sử trao đổi!");
      navigate("/login");
      return;
    }
    const getMainUserId = () => {
      let userId = sessionStorage.getItem("userId");
      if (!userId) userId = localStorage.getItem("userId");
      if (userId) {
        setMainUserId(parseInt(userId));
      } else {
        navigate("/login");
      }
    };
    getMainUserId();
  }, [navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/Requests/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Lấy trạng thái available cho từng sản phẩm
        const historiesWithAvailability = await Promise.all(
          response.data.map(async (history) => {
            let available = 0;
            try {
              const productResponse = await axios.get(
                `${API_BASE_URL}/Products/${history.productId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              available = productResponse.data.available ?? 0;
            } catch (error) {
              console.error(`Lỗi khi lấy trạng thái sản phẩm ${history.productId}:`, error);
            }
            return {
              ...history,
              image: history.image || "https://via.placeholder.com/300x200?text=No+Image",
              ownerAvatar: history.ownerAvatar || "https://via.placeholder.com/50?text=Avatar",
              productName: history.productName || "Không xác định",
              returnDate: history.returnDate || new Date().toISOString(),
              rating: history.rating || null,
              message: history.message || "",
              available,
            };
          })
        );

        const sortedHistories = historiesWithAvailability.sort(
          (a, b) => new Date(b.returnDate) - new Date(a.returnDate)
        );

        setHistories(sortedHistories);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử trao đổi:", error);
        toast.error("Không thể tải lịch sử trao đổi!");
        setHistories([]);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const token = getAuthToken();
        if (!token || !mainUserId) return;
        const response = await axios.get(`${API_BASE_URL}/Requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRequests(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu cầu mượn:", error);
        setUserRequests([]);
      }
    };
    if (mainUserId) fetchUserRequests();
  }, [mainUserId]);

  useEffect(() => {
    const uniqueOwnerIds = Array.from(
      new Set(histories.map((h) => h.userId).filter((id) => id && !userNames[id]))
    );
    uniqueOwnerIds.forEach(async (userId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [userId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${userId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [userId]: "Không xác định",
        }));
      }
    });
  }, [histories]);

  const handleViewProfile = async (userId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/User/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const handleOpenBorrowModal = (productId) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để mượn đồ chơi!");
      navigate("/login");
      return;
    }
    setSelectedProductId(productId);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setBorrowStart(today);
    setBorrowEnd(today);
    setNote("");
    setShowBorrowModal(true);
  };

  const handleCloseBorrowModal = () => {
    setShowBorrowModal(false);
    setBorrowStart(null);
    setBorrowEnd(null);
    setNote("");
    setSelectedProductId(null);
  };

  const handleBorrowStartChange = (date) => {
    setBorrowStart(date);
    if (date) {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      if (!borrowEnd || borrowEnd <= date) {
        setBorrowEnd(nextDay);
      }
    } else {
      setBorrowEnd(null);
    }
  };

  const handleSendRequest = async () => {
    if (isSending) return;
    if (!selectedProductId || !borrowStart || !borrowEnd) {
      toast.error("Vui lòng điền đầy đủ thông tin mượn.");
      return;
    }

    const startDate = new Date(borrowStart);
    startDate.setHours(12, 0, 0, 0);
    const endDate = new Date(borrowEnd);
    endDate.setHours(12, 0, 0, 0);
    const minEndDate = new Date(startDate);
    minEndDate.setDate(startDate.getDate() + 1);

    if (endDate < minEndDate) {
      toast.error("Ngày trả phải sau ngày mượn ít nhất 1 ngày!");
      return;
    }

    setIsSending(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi yêu cầu!");
        navigate("/login");
        return;
      }

      // Kiểm tra trạng thái đồ chơi
      const productResponse = await axios.get(`${API_BASE_URL}/Products/${selectedProductId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (productResponse.data.available !== 0) {
        toast.error("Đồ chơi không sẵn sàng để mượn!");
        handleCloseBorrowModal();
        return;
      }

      const requestDate = new Date().toISOString();
      const rentDate = new Date(borrowStart);
      rentDate.setHours(12, 0, 0, 0);
      const returnDate = new Date(borrowEnd);
      returnDate.setHours(12, 0, 0, 0);

      const formData = new FormData();
      formData.append("ProductId", selectedProductId);
      formData.append("RequestDate", requestDate);
      formData.append("RentDate", rentDate.toISOString());
      formData.append("ReturnDate", returnDate.toISOString());
      formData.append("Message", note || "");

      const response = await axios.post(`${API_BASE_URL}/Requests`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Cập nhật userRequests
      const newRequest = {
        ...response.data,
        productId: selectedProductId,
        userId: mainUserId,
        status: 0,
      };
      setUserRequests((prev) => [...prev, newRequest]);

      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu mượn:", error);
      toast.error(error.response?.data?.message || "Lỗi khi gửi yêu cầu mượn!");
    } finally {
      setIsSending(false);
    }
  };

  const filteredHistories = histories.filter((history) => {
    const statusMatch =
      selectedStatus === "" || history.status.toString() === selectedStatus;
    return (history.status === 1 || history.status === 2) && statusMatch;
  });

  const handleLoadMore = () => {
    toast.info("Đã hiển thị tất cả lịch sử!");
  };

  return (
    <div className="borrow-history-page home-page">
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
            <SideMenu menuItems={sideMenuItems} activeItem={3} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <Row className="filter-section mb-4">
              <Col xs={12} md={{ span: 6, offset: 3 }}>
                <Form.Group controlId="selectStatus" className="mb-0">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-filter"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Row className="request-items-section">
              {filteredHistories.length > 0 ? (
                filteredHistories.map((history) => {
                  const hasSentRequest = userRequests.some(
                    (req) =>
                      req.productId === history.productId &&
                      req.userId === mainUserId &&
                      req.status === 0
                  );
                  return (
                    <Col key={history.requestId} xs={12} md={6} className="mb-4">
                      <Card className="request-card">
                        <div className="image-frame">
                          <Card.Img
                            variant="top"
                            src={history.image}
                            className="toy-image"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                        </div>
                        <Card.Body>
                          <Card.Title className="toy-name">{history.productName}</Card.Title>
                          <Card.Text className="return-date">
                            <strong>Ngày trả:</strong>{" "}
                            {new Date(history.returnDate).toLocaleDateString()}
                          </Card.Text>
                          <Card.Text className="transfer-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                              className={history.status === 1 ? "completed" : "canceled"}
                            >
                              {history.status === 1 ? "Hoàn thành" : "Đã hủy"}
                            </span>
                          </Card.Text>
                          {history.rating && (
                            <Card.Text className="rating">
                              <strong>Đánh giá:</strong> {history.rating}/5
                            </Card.Text>
                          )}
                          {history.message && (
                            <Card.Text className="message">
                              <strong>Phản hồi:</strong> {history.message}
                            </Card.Text>
                          )}
                          <div className="lender-info d-flex align-items-center mb-2">
                            <img
                              src={history.ownerAvatar}
                              alt="Ảnh đại diện người cho mượn"
                              className="lender-avatar"
                              onError={(e) =>
                                (e.target.src = "https://via.placeholder.com/50?text=Avatar")
                              }
                            />
                            <Button
                              variant="link"
                              className="lender-link p-0 text-decoration-none"
                              onClick={() => handleViewProfile(history.userId)}
                            >
                              {userNames[history.userId] || "Đang tải..."}
                            </Button>
                          </div>
                          <div className="request-actions text-center">
                            <Button
                              variant="primary"
                              className="action-btn borrow-btn"
                              onClick={() => handleOpenBorrowModal(history.productId)}
                              disabled={
                                history.available !== 0 ||
                                history.userId === mainUserId ||
                                hasSentRequest
                              }
                            >
                              {hasSentRequest ? "Đã gửi yêu cầu" : "Mượn lại"}
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              ) : (
                <Col xs={12} className="text-center">
                  <p className="no-results">Không có lịch sử trao đổi nào.</p>
                </Col>
              )}
            </Row>
            {filteredHistories.length > 0 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline-primary"
                  className="view-more-btn action-btn"
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
        show={showBorrowModal}
        onHide={handleCloseBorrowModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Nhập thông tin mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="borrowStartDate" className="mb-3">
              <Form.Label>Ngày bắt đầu mượn</Form.Label>
              <DatePicker
                selected={borrowStart}
                onChange={handleBorrowStartChange}
                dateFormat="yyyy-MM-dd"
                className="form-control date-picker-input"
                placeholderText="Chọn ngày bắt đầu"
                minDate={new Date()}
              />
            </Form.Group>
            <Form.Group controlId="borrowEndDate" className="mb-3">
              <Form.Label>Ngày kết thúc mượn</Form.Label>
              <DatePicker
                selected={borrowEnd}
                onChange={(date) => setBorrowEnd(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control date-picker-input"
                placeholderText="Chọn ngày kết thúc"
                minDate={
                  borrowStart
                    ? new Date(borrowStart).setDate(borrowStart.getDate() + 1)
                    : new Date(new Date().setDate(new Date().getDate() + 1))
                }
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
          <Button
            variant="secondary"
            className="action-btn"
            onClick={handleCloseBorrowModal}
          >
            Quay lại
          </Button>
          <Button
            variant="primary"
            className="action-btn"
            onClick={handleSendRequest}
            disabled={isSending}
          >
            {isSending ? "Đang gửi..." : "Gửi yêu cầu"}
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
                src={
                  profileData.avatar || "https://via.placeholder.com/100?text=Avatar"
                }
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(e) =>
                  (e.target.src = "https://via.placeholder.com/100?text=Avatar")
                }
              />
              <p>
                <strong>Tên hiển thị:</strong>{" "}
                {profileData.displayName || "Không có tên"}
              </p>
              <p>
                <strong>Tuổi:</strong> {profileData.age || "Không có thông tin"}
              </p>
              <p>
                <strong>Địa chỉ:</strong>{" "}
                {profileData.address || "Không có thông tin"}
              </p>
              <p>
                <strong>Đánh giá:</strong>{" "}
                {profileData.rating
                  ? profileData.rating.toFixed(2)
                  : "Chưa có đánh giá"}
              </p>
            </div>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="action-btn"
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

export default BorrowHistory;