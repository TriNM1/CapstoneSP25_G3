import React, { useState, useEffect } from "react";
import {
  Container,
  Carousel,
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Header from "../../components/Header";
import banner1 from "../../assets/banner1.jpg";
import banner2 from "../../assets/banner2.jpg";
import banner3 from "../../assets/banner3.jpg";
import banner4 from "../../assets/banner4.jpg";
import banner_test from "../../assets/banner_test.jpg";
import banner_test2 from "../../assets/banner_test2.jpg";
import user from "../../assets/user.png";
import "./Home.scss";
import Footer from "../../components/footer";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [userLocation, setUserLocation] = useState(null);
  const unreadMessages = 3;
  const notificationCount = 2;

  const API_BASE_URL = "https://localhost:7128/api";

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) fetchUserLocation();
  }, []);

  useEffect(() => {
    fetchToyList();
  }, [isLoggedIn, userLocation]);

  const fetchUserLocation = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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

  const banners = [banner1, banner2, banner3, banner4];
  const [toyList, setToyList] = useState([]);

  const fetchToyList = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/Products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const formattedToys = await Promise.all(
        response.data.map(async (toy) => {
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
            id: toy.productId,
            image: toy.imagePaths && toy.imagePaths.length > 0 ? toy.imagePaths[0] : "https://placehold.co/300x200?text=No+Image",
            name: toy.name,
            price: `${toy.price.toLocaleString("vi-VN")} VND`,
            status: toy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
            distance: distance,
            lenderAvatar: toy.user?.avatar || user,
            lenderId: toy.userId,
          };
        })
      );

      setToyList(formattedToys);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đồ chơi:", error);
      toast.error("Không thể tải danh sách đồ chơi!");
      setToyList([]);
    }
  };

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  const handleOpenBorrowModal = (toyId) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để mượn đồ chơi!");
      navigate("/login");
      return;
    }
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
    if (!borrowStart || !borrowEnd) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc!");
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const requestData = {
      productId: selectedToyId,
      rentDate: borrowStart.toISOString().split("T")[0],
      returnDate: borrowEnd.toISOString().split("T")[0],
      message: note || null,
    };

    try {
      await axios.post(`${API_BASE_URL}/Requests`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setToyList((prevList) => prevList.filter((toy) => toy.id !== selectedToyId));
      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu mượn:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu mượn!");
    }
  };

  const handleNavigateToDetail = (toyId) => {
    navigate(`/toydetail/${toyId}`);
  };

  const handleMessage = async (lenderId) => {
    try {
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");
      const token = sessionToken || localToken;
      if (!token) {
        toast.error("Vui lòng đăng nhập để nhắn tin!");
        navigate("/login");
        return;
      }

      // Lấy danh sách cuộc trò chuyện
      const response = await axios.get(`${API_BASE_URL}/Conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversations = response.data;
      console.log("Danh sách cuộc trò chuyện:", conversations);

      // Tìm cuộc trò chuyện với lenderId
      const existingConversation = conversations.find(
        (convo) =>
          (convo.user1Id === lenderId && convo.user2Id === parseInt(localStorage.getItem("userId") || sessionStorage.getItem("userId"))) ||
          (convo.user2Id === lenderId && convo.user1Id === parseInt(localStorage.getItem("userId") || sessionStorage.getItem("userId")))
      );

      let conversationId;

      if (existingConversation) {
        // Nếu đã có cuộc trò chuyện, lấy conversationId
        conversationId = existingConversation.conversationId;
        console.log("Cuộc trò chuyện đã tồn tại, ID:", conversationId);
      } else {
        // Nếu chưa có, tạo mới cuộc trò chuyện
        const createResponse = await axios.post(
          `${API_BASE_URL}/Conversations`,
          { user2Id: lenderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        conversationId = createResponse.data.conversationId;
        console.log("Cuộc trò chuyện mới được tạo, ID:", conversationId);
      }

      // Chuyển hướng đến trang /message với conversationId
      navigate("/message", { state: { activeConversationId: conversationId } });
    } catch (error) {
      console.error("Lỗi khi xử lý nhắn tin:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện!");
      }
    }
  };

  return (
    <div className="home-wrapper">
      <div className="side-banner left-banner">
        <img src={banner_test} alt="Left Banner" />
      </div>
      <div className="home-page">
        <Header
          activeLink={activeLink}
          setActiveLink={setActiveLink}
          isLoggedIn={isLoggedIn}
          unreadMessages={unreadMessages}
          notificationCount={notificationCount}
        />
        <div className="banner-section">
          <Carousel indicators={false} controls={true} interval={3000}>
            {banners.map((banner, index) => (
              <Carousel.Item key={index}>
                <img
                  className="d-block w-100 banner-image"
                  src={banner}
                  alt={`Slide ${index + 1}`}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
        <Container fluid className="mt-4">
          <h2 className="section-title">Đồ chơi đề xuất</h2>
          <Row>
            {toyList.length === 0 ? (
              <Col className="text-center">
                <h5>Không có đồ chơi nào để hiển thị</h5>
              </Col>
            ) : (
              toyList.map((toy) => (
                <Col key={toy.id} xs={12} md={4} className="mb-4">
                  <Card
                    className="toy-card"
                    onClick={() => handleNavigateToDetail(toy.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Img variant="top" src={toy.image} className="toy-image" />
                    <Card.Body>
                      <Card.Title className="toy-name">{toy.name}</Card.Title>
                      <Card.Text className="toy-price">{toy.price}</Card.Text>
                      <Card.Text className="toy-status">
                        <strong>Trạng thái: </strong>
                        <span className={toy.status === "Sẵn sàng cho mượn" ? "available" : "unavailable"}>
                          {toy.status}
                        </span>
                      </Card.Text>
                      <Card.Text className="toy-distance">
                        <strong>Khoảng cách: </strong>
                        {typeof toy.distance === "number" ? `${toy.distance.toFixed(2)} km` : toy.distance}
                      </Card.Text>
                      <div className="lender-info d-flex align-items-center mb-2">
                        <img src={toy.lenderAvatar} alt="Lender Avatar" className="lender-avatar" />
                        <a
                          className="ms-2"
                          href={`/userinfo/${toy.lenderId}`}
                          id="trangcanhanlink"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Trang cá nhân người cho mượn
                        </a>
                      </div>
                      <div className="toy-actions d-flex justify-content-between">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBorrowModal(toy.id);
                          }}
                          disabled={toy.status !== "Sẵn sàng cho mượn"}
                        >
                          Mượn
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessage(toy.lenderId);
                          }}
                        >
                          Nhắn tin
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
          <div className="text-center">
            <Button variant="outline-primary" className="view-more-btn">
              Xem thêm
            </Button>
          </div>
          <Footer />
        </Container>
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
                  className="form-control"
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
                  className="form-control"
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
      <div className="side-banner right-banner">
        <img src={banner_test2} alt="Right Banner" />
      </div>
    </div>
  );
};

export default Home;