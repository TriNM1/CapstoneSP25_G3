import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaStar, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./TransferHistory.scss";
import toy1 from "../../../assets/toy1.jpg";
import user from "../../../assets/user.png";
import Footer from "../../../components/footer";

const TransferHistory = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("transferhistory");

  const sideMenuItems = [
    { id: 1, label: "Đăng Tải Đồ Chơi Mới", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const [transferData, setTransferData] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [visibleItems, setVisibleItems] = useState(6);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const token = sessionToken || localToken;
        if (!token) {
          toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Requests/borrow-history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("API response:", response.data); // Debug API response
        const formattedData = response.data.map((item) => ({
          id: item.requestId,
          image: item.image || toy1,
          name: item.productName,
          price: item.price ? `${item.price.toLocaleString()} VND` : "Không xác định",
          transferDate: item.returnDate ? new Date(item.returnDate).toISOString().split("T")[0] : "Không xác định",
          status: item.requestStatus,
          partnerAvatar: item.borrowerAvatar || user,
          partnerId: item.borrowerId,
          rating: item.rating,
          message: item.message,
          isMock: false,
        }));

        setTransferData(formattedData);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử trao đổi:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
        } else if (error.response && error.response.status === 404) {
          toast.info("Không có lịch sử trao đổi nào.");
        } else {
          toast.error("Không thể tải dữ liệu lịch sử trao đổi!");
        }
        setTransferData([]);
      }
    };

    fetchHistory();
  }, []);

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const handleViewProfile = async (partnerId) => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      const response = await axios.get(`${API_BASE_URL}/User/profile/${partnerId}`, {
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

  const handleRateBorrower = (requestId) => {
    setSelectedRequestId(requestId);
    setShowRatingModal(true);
  };

  const handleSendRating = async () => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      await axios.put(
        `${API_BASE_URL}/Requests/history/${selectedRequestId}/complete`,
        {
          rating: rating,
          message: reviewText || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setTransferData((prev) =>
        prev.map((item) =>
          item.id === selectedRequestId
            ? { ...item, rating: rating, message: reviewText }
            : item
        )
      );
      toast.success("Đã gửi đánh giá thành công!");
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error("Có lỗi xảy ra khi gửi đánh giá!");
    } finally {
      setShowRatingModal(false);
      setRating(null);
      setHoverRating(0);
      setReviewText("");
      setSelectedRequestId(null);
    }
  };

  const formattedFilterDate = filterDate
    ? filterDate.toISOString().split("T")[0]
    : "";
  const filteredTransfers = formattedFilterDate
    ? transferData.filter((item) => item.transferDate === formattedFilterDate)
    : transferData;
  const visibleTransfers = filteredTransfers.slice(0, visibleItems);

  return (
    <div className="transfer-history-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container fluid>
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={5} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <div className="date-filter mb-3">
              <Form.Group controlId="filterDate">
                <Form.Label>Chọn ngày trao đổi</Form.Label>
                <DatePicker
                  selected={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input"
                  placeholderText="Chọn ngày"
                />
              </Form.Group>
            </div>
            {visibleTransfers.length === 0 ? (
              <div className="text-center mt-5">
                <h5>Không có lịch sử trao đổi nào.</h5>
                <p>Chưa có giao dịch nào được hoàn thành hoặc bị hủy.</p>
              </div>
            ) : (
              <>
                <Row className="transfer-items-section">
                  {visibleTransfers.map((item) => (
                    <Col key={item.id} xs={12} md={6} className="mb-4">
                      <Card className="toy-card">
                        <Card.Img variant="top" src={item.image} className="toy-image" />
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{item.name}</Card.Title>
                          <Card.Text className="toy-price">{item.price}</Card.Text>
                          <Card.Text className="transfer-date">
                            <strong>Ngày trao đổi:</strong> {item.transferDate}
                          </Card.Text>
                          <Card.Text className="transfer-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span className={item.status === "completed" ? "completed" : "canceled"}>
                              {item.status === "completed" ? "Hoàn thành" : "Hủy"}
                            </span>
                          </Card.Text>
                          {item.rating && (
                            <Card.Text className="rating">
                              <strong>Đánh giá:</strong> {item.rating}/5
                            </Card.Text>
                          )}
                          {item.message && (
                            <Card.Text className="message">
                              <strong>Phản hồi:</strong> {item.message}
                            </Card.Text>
                          )}
                          <div className="partner-info">
                            <img src={item.partnerAvatar} alt="Ảnh đại diện người mượn" className="partner-avatar" />
                            <Button
                              variant="link"
                              className="p-0 text-decoration-none partner-link"
                              onClick={() => handleViewProfile(item.partnerId)}
                            >
                              Thông tin người mượn
                            </Button>
                          </div>
                          {item.status === "completed" && !item.rating && (
                            <div className="rating-actions">
                              <Button
                                variant="primary"
                                onClick={() => handleRateBorrower(item.id)}
                              >
                                Đánh giá người mượn
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleTransfers.length < filteredTransfers.length && (
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

      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người mượn</Modal.Title>
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

      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
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
                      color: star <= (hoverRating || (rating || 0)) ? "#ffc107" : "#ddd",
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
              <Form.Label>Phản hồi (Tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập phản hồi của bạn"
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

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default TransferHistory;