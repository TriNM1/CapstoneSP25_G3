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
import { FaStar, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import toy1 from "../../../assets/toy1.jpg";
import user from "../../../assets/user.png";
import "./InLending.scss";

const InLending = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("lending");

  const sideMenuItems = [
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const [selectedDate, setSelectedDate] = useState(null);
  const [lendings, setLendings] = useState([]);
  const [visibleItems, setVisibleItems] = useState(4);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedLendingId, setSelectedLendingId] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  useEffect(() => {
    const fetchLendings = async () => {
      try {
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const token = sessionToken || localToken;
        if (!token) {
          toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
          navigate("/login");
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/Requests/borrowing`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const filteredLendings = response.data
          .filter((req) => req.requestStatus === "Accepted")
          .map((req) => ({
            id: req.requestId,
            image: req.image || toy1,
            name: req.productName,
            borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
            returnDate: new Date(req.returnDate).toISOString().split("T")[0],
            lenderId: req.userId,
            lenderAvatar: req.borrowerAvatar || user,
          }));
        setLendings(filteredLendings);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi đang cho mượn:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
          navigate("/login");
        } else {
          toast.error("Không thể tải dữ liệu từ API!");
        }
        setLendings([]);
      }
    };

    fetchLendings();
  }, [navigate]);

  const handleReturn = (id) => {
    setSelectedLendingId(id);
    setShowRatingModal(true);
  };

  const handleSendRating = async () => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      await axios.put(
        `${API_BASE_URL}/Requests/history/${selectedLendingId}/complete`,
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
      setLendings((prev) => prev.filter((item) => item.id !== selectedLendingId));
      toast.success("Đã hoàn thành yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi khi hoàn thành yêu cầu:", error);
      toast.error("Có lỗi xảy ra khi hoàn thành yêu cầu! Chỉ xóa cục bộ.");
      setLendings((prev) => prev.filter((item) => item.id !== selectedLendingId));
    } finally {
      setShowRatingModal(false);
      setRating(null);
      setHoverRating(0);
      setReviewText("");
      setSelectedLendingId(null);
    }
  };

  const handleReport = (id) => {
    setSelectedReportId(id);
    setShowReportModal(true);
  };

  const handleSendReport = async () => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      await axios.put(
        `${API_BASE_URL}/Requests/${selectedReportId}/cancel`,
        {
          reason: reportReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setLendings((prev) => prev.filter((item) => item.id !== selectedReportId));
      toast.success("Đã hủy yêu cầu và gán 1 sao cho người mượn!");
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu:", error);
      toast.error("Có lỗi xảy ra khi hủy yêu cầu! Chỉ xóa cục bộ.");
      setLendings((prev) => prev.filter((item) => item.id !== selectedReportId));
    } finally {
      setShowReportModal(false);
      setReportReason("");
      setSelectedReportId(null);
    }
  };

  const handleMessage = (lenderId) => {
    toast.info("Chức năng nhắn tin đang chờ API tạo conversation!");
  };

  const handleViewProfile = async (lenderId) => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/User/profile/${lenderId}`, {
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

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const formattedFilterDate = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : "";
  const filteredLendings = formattedFilterDate
    ? lendings.filter((item) => item.borrowDate === formattedFilterDate)
    : lendings;
  const visibleLendings = filteredLendings.slice(0, visibleItems);

  const canCancelRequest = (borrowDate) => {
    const today = new Date().toISOString().split("T")[0];
    return today >= borrowDate;
  };

  return (
    <div className="inlending-page home-page">
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
            <SideMenu menuItems={sideMenuItems} activeItem={3} />
          </Col>
          <Col xs={12} md={10} className={`main-content ${lendings.length === 0 ? 'empty' : ''}`}>
            <Form.Group controlId="selectDate" className="mb-3">
              <Form.Label>Chọn ngày mượn</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Tìm kiếm theo ngày"
              />
            </Form.Group>
            {visibleLendings.length === 0 ? (
              <div className="text-center">
                <h5>Không có đồ chơi nào trong trạng thái đang cho mượn</h5>
              </div>
            ) : (
              <>
                <Row className="lending-items-section">
                  {visibleLendings.map((item) => (
                    <Col key={item.id} xs={12} md={6} className="mb-4">
                      <Card className="toy-card">
                        <Card.Img variant="top" src={item.image} className="toy-image" />
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{item.name}</Card.Title>
                          <Card.Text className="borrow-date">
                            <strong>Ngày mượn:</strong> {item.borrowDate}
                          </Card.Text>
                          <Card.Text className="return-date">
                            <strong>Ngày trả:</strong> {item.returnDate}
                          </Card.Text>
                          <Card.Text className="lending-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span className="in-progress">Đang cho mượn</span>
                          </Card.Text>
                          <div className="lender-info">
                            <img src={item.lenderAvatar} alt="Ảnh đại diện người mượn" className="lender-avatar" />
                            <span>
                              <Button
                                variant="link"
                                className="p-0 text-decoration-none"
                                onClick={() => handleViewProfile(item.lenderId)}
                              >
                                Thông tin người mượn
                              </Button>
                            </span>
                          </div>
                          <div className="card-actions">
                            <Button className="btn-message" onClick={() => handleMessage(item.lenderId)}>
                              Nhắn tin
                            </Button>
                            <Button className="btn-return" onClick={() => handleReturn(item.id)}>
                              Đã trả
                            </Button>
                            {canCancelRequest(item.borrowDate) && (
                              <Button className="btn-cancel" onClick={() => handleReport(item.id)}>
                                Hủy yêu cầu
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleLendings.length < filteredLendings.length && (
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
      </Container>

      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá người mượn (Tùy chọn)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="ratingStars" className="mb-3">
              <Form.Label>Đánh giá sao (Tùy chọn)</Form.Label>
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
              <Form.Label>Đánh giá (Tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập đánh giá của bạn"
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
            <FaPaperPlane className="me-2" /> Xác nhận hoàn thành
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hủy yêu cầu cho mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="reportReason" className="mb-3">
              <Form.Label>Nhập lý do hủy</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lý do hủy yêu cầu"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSendReport}>
            <FaPaperPlane className="me-2" /> Gửi
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
                src={profileData.avatar || user}
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

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default InLending;