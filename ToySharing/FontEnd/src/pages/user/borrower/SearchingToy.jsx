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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_BASE_URL = "https://localhost:7128/api";

  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
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
    if (token) fetchUserLocation();
  }, [navigate]);

  const fetchUserLocation = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        async (error) => {
          console.error("Lỗi khi lấy vị trí người dùng từ Geolocation:", error);
          await fetchLocationFromDatabase(token);
        }
      );
    } else {
      console.error("Trình duyệt không hỗ trợ Geolocation.");
      await fetchLocationFromDatabase(token);
    }
  };

  const fetchLocationFromDatabase = async (token) => {
    try {
      if (!token) {
        console.error("Token không tồn tại.");
        setUserLocation(null);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/User/current/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.latitude !== null && response.data.longitude !== null) {
        setUserLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
      } else {
        toast.warn("Vị trí của bạn chưa được xác định trong hồ sơ.");
        setUserLocation(null);
      }
    } catch (error) {
      console.error("Lỗi khi lấy vị trí từ database:", error);
      toast.error("Không thể lấy vị trí từ hồ sơ người dùng.");
      setUserLocation(null);
    }
  };

  useEffect(() => {
    const fetchToys = async () => {
      try {
        const token = getAuthToken();
        if (!token || !mainUserId) return;

        const response = await axios.get(`${API_BASE_URL}/Products/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedToys = await Promise.all(response.data.map(async (toy) => {
          let distance;
          if (isLoggedIn && userLocation && userLocation.latitude !== null && userLocation.longitude !== null) {
            const distResponse = await axios.get(
              `${API_BASE_URL}/User/distance-to-product/${toy.productId}?myLatitude=${userLocation.latitude}&myLongitude=${userLocation.longitude}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            distance = distResponse.data.distanceKilometers !== null ? distResponse.data.distanceKilometers : distResponse.data.distanceText;
          } else if (isLoggedIn) {
            distance = "Vị trí của bạn chưa được xác định";
          } else {
            distance = "Vui lòng đăng nhập để biết khoảng cách";
          }
          return {
            productId: toy.productId,
            userId: toy.userId,
            image: toy.imagePaths && toy.imagePaths.length > 0 ? toy.imagePaths[0] : "https://placehold.co/300x200?text=No+Image",
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
            distance: distance,
          };
        }));

        setToys(formattedToys);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi:", error);
        toast.error("Không thể tải danh sách đồ chơi!");
        setToys([]);
      }
    };

    if (mainUserId) fetchToys();
  }, [mainUserId, userLocation, isLoggedIn]);

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

      setUserRequests([...userRequests, response.data]);
      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (err) {
      toast.error("Lỗi khi gửi yêu cầu mượn!");
    }
  };

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

  const handleViewProfile = async (ownerId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/User/profile/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileData(response.data.userInfo);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const handleLoadMore = () => {
    toast.info("Đã hiển thị tất cả đồ chơi!");
  };

  return (
    <div className="searching-toy-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={isLoggedIn}
        unreadMessages={3}
        notificationCount={2}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>
          <Col xs={12} md={10} className="main-content">
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
                  (req) => req.productId === toy.productId && req.userId === mainUserId && req.status === 0
                );
                return (
                  <Col key={toy.productId} xs={12} md={6} className="mb-4">
                    <Card className="request-card">
                      <Card.Img variant="top" src={toy.image} className="toy-image" />
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
                        <Card.Text className="distance">
                          <strong>Khoảng cách:</strong>{" "}
                          {typeof toy.distance === "number" ? `${toy.distance.toFixed(2)} km` : toy.distance}
                        </Card.Text>
                        <div className="lender-info d-flex align-items-center mb-2">
                          <img
                            src={toy.ownerAvatar || "https://placehold.co/50x50?text=Avatar"}
                            alt="Ảnh đại diện người cho mượn"
                            className="lender-avatar"
                          />
                          <Button
                            variant="link"
                            className="ms-2 lender-link p-0 text-decoration-none"
                            onClick={() => handleViewProfile(toy.ownerId)}
                          >
                            Thông tin người cho mượn
                          </Button>
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
                <Button variant="outline-primary" className="view-more-btn" onClick={handleLoadMore}>
                  Xem thêm
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedToy && (
            <>
              <img
                src={selectedToy.imagePaths && selectedToy.imagePaths.length > 0 ? selectedToy.imagePaths[0] : "https://placehold.co/200x200?text=No+Image"}
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
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người cho mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={profileData.avatar || "https://placehold.co/100x100?text=Avatar"}
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

export default SearchingToy;