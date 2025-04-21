import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal } from "react-bootstrap";
import { FaStar, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./TransferHistory.scss";
import Footer from "../../../components/footer";

const TransferHistory = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("transferhistory");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [transferData, setTransferData] = useState([]);
  const [visibleItems, setVisibleItems] = useState(6);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [userNames, setUserNames] = useState({}); // Store displayName for partners

  const sideMenuItems = [
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "1", label: "Hoàn thành" },
    { value: "2", label: "Hủy" },
  ];

  const API_BASE_URL = "https://localhost:7128/api";

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Requests/borrow-history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const formattedData = response.data
          .map((item) => ({
            id: item.requestId,
            image: item.image || "https://via.placeholder.com/300x200?text=No+Image",
            name: item.productName,
            price: item.price ? `${item.price.toLocaleString()} VND` : "Không xác định",
            transferDate: item.returnDate
              ? new Date(item.returnDate).toISOString().split("T")[0]
              : "Không xác định",
            status: item.requestStatus === "completed" ? 1 : 2,
            partnerAvatar: item.borrowerAvatar || "https://via.placeholder.com/50?text=Avatar",
            partnerId: item.borrowerId,
            rating: item.rating,
            message: item.message,
            isMock: false,
          }))
          .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate));

        setTransferData(formattedData);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử trao đổi:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
          navigate("/login");
        } else if (error.response && error.response.status === 404) {
          toast.info("Không có lịch sử trao đổi nào.");
        } else {
          toast.error("Không thể tải dữ liệu lịch sử trao đổi!");
        }
        setTransferData([]);
      }
    };

    fetchHistory();
  }, [navigate]);

  // Fetch displayName for partners
  useEffect(() => {
    const uniquePartnerIds = Array.from(
      new Set(
        transferData
          .map((t) => t.partnerId)
          .filter((id) => id && !userNames[id])
      )
    );
    uniquePartnerIds.forEach(async (partnerId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${partnerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [partnerId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${partnerId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [partnerId]: "Không xác định",
        }));
      }
    });
  }, [transferData]);

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const handleViewProfile = async (partnerId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/User/profile/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId: partnerId });
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
    if (!rating) {
      toast.error("Vui lòng chọn số sao để đánh giá!");
      return;
    }

    try {
      const token = getAuthToken();
      await axios.put(
        `${API_BASE_URL}/Requests/history/${selectedRequestId}/rate`,
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
      let errorMessage = "Có lỗi xảy ra khi gửi đánh giá!";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
          navigate("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (error.response.status === 404) {
          errorMessage = "Lịch sử không tồn tại!";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Yêu cầu không hợp lệ!";
        }
      }
      toast.error(errorMessage);
    } finally {
      setShowRatingModal(false);
      setRating(null);
      setHoverRating(0);
      setReviewText("");
      setSelectedRequestId(null);
    }
  };

  const filteredTransfers = transferData.filter(
    (item) => selectedStatus === "" || item.status.toString() === selectedStatus
  );
  const visibleTransfers = filteredTransfers.slice(0, visibleItems);

  return (
    <div className="transfer-history-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={5} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <Row className="filter-section mb-3">
              <Col md={3}></Col>
              <Col md={6}>
                <Form.Group controlId="selectStatus">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
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
            {filteredTransfers.length === 0 ? (
              <div className="text-center mt-5">
                <p className="no-results">Không có lịch sử trao đổi nào.</p>
              </div>
            ) : (
              <>
                <Row className="transfer-items-section">
                  {visibleTransfers.map((item) => (
                    <Col key={item.id} xs={12} md={6} className="mb-4">
                      <Card className="toy-card">
                        <div className="image-frame">
                          <Card.Img
                            variant="top"
                            src={item.image}
                            className="toy-image"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                        </div>
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{item.name}</Card.Title>
                          <Card.Text className="toy-price">{item.price}</Card.Text>
                          <Card.Text className="transfer-date">
                            <strong>Ngày trao đổi:</strong> {item.transferDate}
                          </Card.Text>
                          <Card.Text className="transfer-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                              className={item.status === 1 ? "completed" : "canceled"}
                            >
                              {item.status === 1 ? "Hoàn thành" : "Hủy"}
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
                          <div className="partner-info d-flex align-items-center mb-2">
                            <img
                              src={item.partnerAvatar}
                              alt="Ảnh đại diện người mượn"
                              className="partner-avatar"
                              onError={(e) =>
                                (e.target.src = "https://via.placeholder.com/50?text=Avatar")
                              }
                            />
                            <Button
                              variant="link"
                              className="partner-link p-0 text-decoration-none"
                              onClick={() => handleViewProfile(item.partnerId)}
                            >
                              {userNames[item.partnerId] || "Đang tải..."}
                            </Button>
                          </div>
                          {item.status === 1 && !item.rating && (
                            <div className="rating-actions">
                              <Button
                                variant="primary"
                                className="action-btn"
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
                    <Button
                      variant="outline-primary"
                      className="view-more-btn"
                      onClick={handleLoadMore}
                    >
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />

      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={
                  profileData.avatar ||
                  "https://via.placeholder.com/100?text=Avatar"
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
            onClick={() => setShowProfileModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        centered
      >
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
                      color:
                        star <= (hoverRating || (rating || 0))
                          ? "#ffc107"
                          : "#ddd",
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
          <Button
            variant="secondary"
            onClick={() => setShowRatingModal(false)}
          >
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