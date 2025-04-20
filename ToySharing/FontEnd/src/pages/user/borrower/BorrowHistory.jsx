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
  const [selectedDate, setSelectedDate] = useState(null);
  const [histories, setHistories] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const token = sessionToken || localToken;
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

        // Sắp xếp theo returnDate từ mới nhất đến cũ nhất
        const sortedHistories = response.data
          .sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate));

        setHistories(sortedHistories);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử trao đổi:", error);
        toast.error("Không thể tải lịch sử trao đổi!");
        setHistories([]);
      }
    };

    fetchHistory();
  }, [navigate]);

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
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const filteredHistories = selectedDate
    ? histories.filter((history) => {
        const returnDate = new Date(history.returnDate);
        return (
          (history.status === 1 || history.status === 2) &&
          returnDate.getDate() === selectedDate.getDate() &&
          returnDate.getMonth() === selectedDate.getMonth() &&
          returnDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : histories.filter((history) => history.status === 1 || history.status === 2);

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
            <Form.Group controlId="selectDate" className="mb-3">
              <Form.Label>Chọn ngày trả</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Chọn ngày"
              />
            </Form.Group>
            <Row className="request-items-section">
              {filteredHistories.map((history) => (
                <Col key={history.requestId} xs={12} md={6} className="mb-4">
                  <Card className="request-card">
                    <Card.Img
                      variant="top"
                      src={history.image || "https://via.placeholder.com/300x200?text=No+Image"}
                      className="toy-image"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">{history.productName}</Card.Title>
                      <Card.Text className="return-date">
                        <strong>Ngày trả:</strong>{" "}
                        {new Date(history.returnDate).toLocaleDateString()}
                      </Card.Text>
                      <Card.Text className="transfer-status">
                        <strong>Trạng thái:</strong>{" "}
                        <span className={history.status === 1 ? "completed" : "pending"}>
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
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/50?text=Avatar";
                          }}
                        />
                        <Button
                          variant="link"
                          className="lender-link p-0 text-decoration-none"
                          onClick={() => handleViewProfile(history.userId)}
                        >
                          {history.ownerName}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {filteredHistories.length > 0 && (
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

      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người cho mượn</Modal.Title>
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
              <p><strong>Tên hiển thị:</strong> {profileData.displayName}</p>
              <p><strong>Tuổi:</strong> {profileData.age}</p>
              <p><strong>Địa chỉ:</strong> {profileData.address}</p>
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

export default BorrowHistory;