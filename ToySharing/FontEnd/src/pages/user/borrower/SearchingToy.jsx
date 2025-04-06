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
import "./SearchingToy.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchingToy = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("searching-toy");
  const [selectedDate, setSelectedDate] = useState(null);
  const [toys, setToys] = useState([]);
  const [mainUserId, setMainUserId] = useState(null);
  const [userRequests, setUserRequests] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  // Side Menu Items
  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  // Lấy token từ localStorage hoặc sessionStorage
  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  // Lấy mainUserId từ localStorage hoặc sessionStorage
  useEffect(() => {
    const getMainUserId = () => {
      let userId = sessionStorage.getItem("userId");
      if (!userId) userId = localStorage.getItem("userId");
      if (userId) {
        setMainUserId(parseInt(userId));
      } else {
        toast.error("Không tìm thấy ID người dùng. Vui lòng đăng nhập lại!");
        navigate("/login");
      }
    };
    getMainUserId();
  }, [navigate]);

  // Lấy danh sách đồ chơi sẵn sàng cho mượn
  useEffect(() => {
    const fetchToys = async () => {
      try {
        const token = getAuthToken();
        if (!token || !mainUserId) return;

        const response = await axios.get(`${API_BASE_URL}/Products/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedToys = response.data.map((toy) => ({
          productId: toy.productId,
          userId: toy.userId,
          image: toy.imagePaths && toy.imagePaths.length > 0 ? toy.imagePaths[0] : "https://via.placeholder.com/300x200?text=No+Image",
          name: toy.name,
          createdAt: new Date(toy.createdAt).toISOString().split("T")[0],
          categoryName: toy.categoryName,
          productStatus: toy.productStatus,
          suitableAge: toy.suitableAge,
          price: toy.price,
          description: toy.description,
          available: toy.available,
          ownerName: toy.ownerName || "Người cho mượn",
          ownerId: toy.userId,
        }));

        setToys(formattedToys);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi:", error);
        toast.error("Không thể tải danh sách đồ chơi!");
        setToys([]);
      }
    };

    if (mainUserId) fetchToys();
  }, [mainUserId]);

  // Lấy danh sách yêu cầu mượn của người dùng hiện tại
  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const token = getAuthToken();
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

  // Lọc đồ chơi theo ngày tạo (nếu có)
  const filteredToys = selectedDate
    ? toys.filter((toy) => {
        const toyDate = new Date(toy.createdAt);
        return (
          toyDate.getDate() === selectedDate.getDate() &&
          toyDate.getMonth() === selectedDate.getMonth() &&
          toyDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : toys;

  // Mở modal chọn ngày mượn và ngày trả
  const handleOpenBorrowModal = (toyId) => {
    setSelectedToyId(toyId);
    setShowBorrowModal(true);
  };

  const handleCloseBorrowModal = () => {
    setShowBorrowModal(false);
    setBorrowStart(null);
    setBorrowEnd(null);
    setNote("");
    setSelectedToyId(null);
  };

  // Xử lý gửi yêu cầu mượn
  const handleSendRequest = async () => {
    if (!selectedToyId || !borrowStart || !borrowEnd) {
      toast.error("Vui lòng điền đầy đủ thông tin mượn.");
      return;
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("ProductId", selectedToyId);
      formData.append("RequestDate", new Date().toISOString());
      formData.append("RentDate", borrowStart.toISOString());
      formData.append("ReturnDate", borrowEnd.toISOString());
      formData.append("Message", note || "");

      const response = await axios.post(`${API_BASE_URL}/Requests`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Cập nhật danh sách yêu cầu mượn
      setUserRequests([...userRequests, response.data]);
      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.message || "Lỗi khi gửi yêu cầu mượn!");
      } else {
        toast.error("Lỗi khi gửi yêu cầu mượn!");
      }
    }
  };

  // Hiển thị chi tiết đồ chơi khi nhấp vào tên
  const handleViewDetail = async (toyId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/Products/${toyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedToy(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đồ chơi:", error);
      toast.error("Không thể tải chi tiết đồ chơi!");
    }
  };

  // Xử lý "Xem thêm" (giả lập phân trang)
  const handleLoadMore = () => {
    toast.info("Đã hiển thị tất cả đồ chơi!");
  };

  return (
    <div className="searching-toy-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />

      <Container fluid className="mt-4">
        <Row>
          {/* Side Menu */}
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* DatePicker để chọn ngày (lọc theo ngày tạo đồ chơi) */}
            <Form.Group controlId="selectDate" className="mb-3">
              <Form.Label>Chọn ngày</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Chọn ngày"
              />
            </Form.Group>
            <Row className="request-items-section">
              {filteredToys.map((toy) => {
                const hasSentRequest = userRequests.some(
                  (req) =>
                    req.productId === toy.productId &&
                    req.userId === mainUserId &&
                    req.status === 0 // Chỉ kiểm tra các yêu cầu có status == 0 (pending)
                );
                return (
                  <Col key={toy.productId} xs={12} md={6} className="mb-4">
                    <Card className="request-card">
                      <Card.Img
                        variant="top"
                        src={toy.image}
                        className="toy-image"
                      />
                      <Card.Body>
                        <Card.Title className="toy-name">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleViewDetail(toy.productId);
                            }}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {toy.name}
                          </a>
                        </Card.Title>
                        <Card.Text className="send-date">
                          <strong>Ngày đăng:</strong> {toy.createdAt}
                        </Card.Text>
                        <Card.Text className="price">
                          <strong>Phí cho mượn:</strong> {toy.price.toLocaleString("vi-VN")} VND
                        </Card.Text>
                        <Card.Text className="status">
                          <strong>Trạng thái:</strong>{" "}
                          <span className={toy.available === 0 ? "available" : "unavailable"}>
                            {toy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn"}
                          </span>
                        </Card.Text>
                        <div className="lender-info d-flex align-items-center mb-2">
                          <img
                            src={"https://via.placeholder.com/50?text=Avatar"}
                            alt="Lender Avatar"
                            className="lender-avatar"
                          />
                          <a
                            href={`/userinfo/${toy.ownerId}`}
                            className="ms-2 lender-link"
                          >
                            {toy.ownerName}
                          </a>
                        </div>
                        <div className="request-actions text-center">
                          <Button
                            variant="primary"
                            onClick={() => handleOpenBorrowModal(toy.productId)}
                            disabled={hasSentRequest}
                          >
                            {hasSentRequest ? "Đã gửi yêu cầu" : "Mượn"}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            {filteredToys.length > 0 && (
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

      {/* Modal chi tiết đồ chơi */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedToy && (
            <>
              <img
                src={selectedToy.imagePaths && selectedToy.imagePaths.length > 0 ? selectedToy.imagePaths[0] : "https://via.placeholder.com/200"}
                alt={selectedToy.name}
                style={{ width: "100%", height: "auto", maxHeight: "200px", objectFit: "cover" }}
              />
              <h5 className="mt-3">{selectedToy.name}</h5>
              <p><strong>Danh mục:</strong> {selectedToy.categoryName || "Không có"}</p>
              <p><strong>Tình trạng:</strong> {selectedToy.productStatus || "Không có"}</p>
              <p><strong>Độ tuổi phù hợp:</strong> {selectedToy.suitableAge}</p>
              <p><strong>Phí cho mượn:</strong> {selectedToy.price.toLocaleString("vi-VN")} VND</p>
              <p><strong>Mô tả:</strong> {selectedToy.description || "Không có"}</p>
              <p><strong>Trạng thái:</strong> {selectedToy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn"}</p>
              {userRequests.some((req) => req.productId === selectedToy.productId && req.status === 0) && (
                <p className="text-success">Bạn đã gửi yêu cầu mượn cho đồ chơi này.</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal chọn ngày mượn và ngày trả */}
      <Modal show={showBorrowModal} onHide={handleCloseBorrowModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nhập thông tin mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="borrowStartDate" className="mb-3">
              <Form.Label>Ngày bắt đầu mượn</Form.Label>
              <DatePicker
                selected={borrowStart}
                onChange={(date) => setBorrowStart(date)}
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
                minDate={borrowStart || new Date()}
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
          <Button variant="secondary" onClick={handleCloseBorrowModal}>
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleSendRequest}>
            Gửi yêu cầu
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SearchingToy;