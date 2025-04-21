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
    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Vui lòng đăng nhập để xem lịch sử trao đổi!");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Requests/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const sortedHistories = response.data.sort(
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
  }, [navigate]);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
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
              <Col xs={12} md={{ span:6, offset: 3 }}>
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
                filteredHistories.map((history) => (
                  <Col key={history.requestId} xs={12} md={6} className="mb-4">
                    <Card className="request-card">
                      <div className="image-frame">
                        <Card.Img
                          variant="top"
                          src={history.image || "https://via.placeholder.com/300x200?text=No+Image"}
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
                            src={
                              history.ownerAvatar ||
                              "https://via.placeholder.com/50?text=Avatar"
                            }
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
                      </Card.Body>
                    </Card>
                  </Col>
                ))
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