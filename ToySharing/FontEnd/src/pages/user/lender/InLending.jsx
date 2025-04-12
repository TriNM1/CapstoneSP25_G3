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
    { id: 1, label: "Đăng Tải Đồ Chơi Mới", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const [selectedDate, setSelectedDate] = useState(null);
  const [lendings, setLendings] = useState([]);
  const [visibleItems, setVisibleItems] = useState(4);
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
          .filter((req) => req.requestStatus === "Accepted" || req.requestStatus === "PickedUp")
          .map((req) => ({
            id: req.requestId,
            image: req.image || toy1,
            name: req.productName,
            borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
            returnDate: new Date(req.returnDate).toISOString().split("T")[0],
            lenderId: req.userId,
            lenderAvatar: req.borrowerAvatar || user,
            status: req.requestStatus,
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
                            <span className="in-progress">
                              {item.status === "Accepted" ? "Đã chấp nhận" : "Đã lấy"}
                            </span>
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