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
import "./Home.scss";
import Footer from "../../components/footer";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [toyList, setToyList] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRequests, setUserRequests] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const unreadMessages = 3;
  const notificationCount = 2;

  const API_BASE_URL = "https://localhost:7128/api";
  const banners = [banner1, banner2, banner3, banner4];

  const getAuthToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    const storedUserId = parseInt(
      localStorage.getItem("userId") || sessionStorage.getItem("userId") || 0
    );
    setUserId(storedUserId);
    if (token) fetchUserLocation();
  }, []);

  useEffect(() => {
    fetchToyList();
  }, [isLoggedIn, userLocation, userAddress]);

  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const token = getAuthToken();
        if (!token || !userId) return;
        const response = await axios.get(`${API_BASE_URL}/Requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRequests(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu cầu mượn:", error);
        setUserRequests([]);
      }
    };

    if (userId) fetchUserRequests();
  }, [userId]);

  const fetchUserLocation = async () => {
    const token = getAuthToken();
    if (!token) {
      setUserLocation(null);
      setUserAddress(null);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/User/current/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { address, latitude, longitude } = response.data;

      if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        setUserLocation({ latitude, longitude });
        setUserAddress(address || "Địa chỉ không được cung cấp");
        return;
      }

      if (address) {
        setUserAddress(address);
        const coordinates = await getCoordinatesFromAddress(address);
        if (coordinates) {
          setUserLocation(coordinates);
          return;
        }
      }

      setUserLocation(null);
      setUserAddress(null);
      toast.warn("Vị trí của bạn chưa được xác định trong hồ sơ.");
    } catch (error) {
      console.error("Lỗi khi lấy vị trí từ database:", error);
      setUserLocation(null);
      setUserAddress(null);
      toast.warn("Vui lòng cung cấp vị trí để tính khoảng cách.");
    }

    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setUserAddress(null);
        },
        (error) => {
          console.error("Lỗi khi lấy vị trí từ Geolocation:", error);
          if (!userLocation && !userAddress) {
            toast.warn("Vui lòng cung cấp vị trí để tính khoảng cách.");
          }
        }
      );
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    if (!address) {
      console.warn("Địa chỉ trống, không thể lấy tọa độ.");
      return null;
    }
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=jsonv2`,
        {
          headers: {
            "User-Agent": "ToySharingApp",
          },
        }
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
          return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          };
        }
      }
      console.warn(`Không tìm thấy tọa độ cho địa chỉ: ${address}`);
      return null;
    } catch (error) {
      console.error(`Lỗi khi lấy tọa độ cho địa chỉ ${address}:`, error);
      return null;
    }
  };

  const fetchToyList = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/Products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const formattedToys = await Promise.all(
        response.data.map(async (toy) => {
          let distance;
          let lenderAvatar = toy.user?.avatar || "https://placehold.co/50x50?text=No+Avatar";

          if (!toy.user?.avatar && toy.userId) {
            try {
              const profileResponse = await axios.get(
                `${API_BASE_URL}/User/profile/${toy.userId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              lenderAvatar =
                profileResponse.data.userInfo?.avatar ||
                "https://placehold.co/50x50?text=No+Avatar";
            } catch (error) {
              console.error(`Lỗi khi lấy avatar của user ${toy.userId}:`, error);
            }
          }

          if (!isLoggedIn) {
            distance = "Vui lòng đăng nhập để biết khoảng cách";
          } else {
            let ownerAddress, ownerLatitude, ownerLongitude;

            try {
              const ownerLocationResponse = await axios.get(
                `${API_BASE_URL}/User/${toy.userId}/location`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              ownerAddress = ownerLocationResponse.data.address;
              ownerLatitude = ownerLocationResponse.data.latitude;
              ownerLongitude = ownerLocationResponse.data.longitude;
            } catch (error) {
              console.error(`Lỗi khi lấy địa chỉ chủ sở hữu ${toy.userId}:`, error);
              distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
              return { ...toy, distance, lenderAvatar };
            }

            if (!ownerLatitude || !ownerLongitude) {
              if (ownerAddress) {
                const ownerCoords = await getCoordinatesFromAddress(ownerAddress);
                if (ownerCoords) {
                  ownerLatitude = ownerCoords.latitude;
                  ownerLongitude = ownerCoords.longitude;
                } else {
                  distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
                  return { ...toy, distance, lenderAvatar };
                }
              } else {
                distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
                return { ...toy, distance, lenderAvatar };
              }
            }

            if (userLocation && userLocation.latitude && userLocation.longitude) {
              try {
                const distResponse = await axios.get(
                  `${API_BASE_URL}/User/distance-to-product/${toy.productId}?myLatitude=${userLocation.latitude}&myLongitude=${userLocation.longitude}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                distance = distResponse.data.distanceKilometers ?? "Không thể tính khoảng cách";
              } catch (error) {
                console.error(`Lỗi khi tính khoảng cách cho đồ chơi ${toy.productId}:`, error);
                distance =
                  error.response?.status === 400
                    ? "Chưa xác định vị trí của người sở hữu đồ chơi"
                    : "Không thể tính khoảng cách";
              }
            } else {
              distance = "Chưa xác định vị trí của bạn";
            }
          }

          return {
            id: toy.productId,
            image:
              toy.imagePaths && toy.imagePaths.length > 0
                ? toy.imagePaths[0]
                : "https://placehold.co/300x200?text=No+Image",
            name: toy.name || "Không có tên",
            price: toy.price ? `${toy.price.toLocaleString("vi-VN")} VND` : "Không có giá",
            status: toy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
            distance,
            lenderAvatar,
            lenderId: toy.userId,
            categoryName: toy.categoryName || "Không có danh mục",
            productStatus:
              toy.productStatus === 0
                ? "Mới"
                : toy.productStatus === 1
                ? "Cũ"
                : "Không xác định",
            suitableAge: toy.suitableAge || "Không xác định",
            description: toy.description || "Không có mô tả",
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
    if (isSending) return;
    if (!borrowStart || !borrowEnd) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc!");
      return;
    }

    setIsSending(true);
    const token = getAuthToken();

    // Check product availability
    try {
      const productResponse = await axios.get(`${API_BASE_URL}/Products/${selectedToyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (productResponse.data.available !== 0) {
        toast.error("Đồ chơi không sẵn sàng để mượn!");
        handleCloseBorrowModal();
        setIsSending(false);
        return;
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đồ chơi:", error);
      toast.error("Không thể kiểm tra trạng thái đồ chơi!");
      setIsSending(false);
      return;
    }

    const formData = new FormData();
    formData.append("ProductId", selectedToyId);
    formData.append("RequestDate", new Date().toISOString());
    formData.append("RentDate", borrowStart.toISOString());
    formData.append("ReturnDate", borrowEnd.toISOString());
    formData.append("Message", note || "");

    try {
      const response = await axios.post(`${API_BASE_URL}/Requests`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setToyList((prevList) =>
        prevList.filter((toy) => toy.id !== selectedToyId)
      );
      setUserRequests((prev) => [...prev, response.data]);
      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu mượn:", error);
      toast.error(
        error.response?.data || "Có lỗi xảy ra khi gửi yêu cầu mượn!"
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleViewDetail = async (toyId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/Products/${toyId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let lenderAvatar = response.data.user?.avatar || "https://placehold.co/50x50?text=No+Avatar";
      if (!response.data.user?.avatar && response.data.userId) {
        try {
          const profileResponse = await axios.get(
            `${API_BASE_URL}/User/profile/${response.data.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          lenderAvatar =
            profileResponse.data.userInfo?.avatar ||
            "https://placehold.co/50x50?text=No+Avatar";
        } catch (error) {
          console.error(`Lỗi khi lấy avatar của user ${response.data.userId}:`, error);
        }
      }

      setSelectedToy({
        id: response.data.productId,
        image:
          response.data.imagePaths && response.data.imagePaths.length > 0
            ? response.data.imagePaths[0]
            : "https://placehold.co/300x200?text=No+Image",
        name: response.data.name || "Không có tên",
        categoryName: response.data.categoryName || "Không có danh mục",
        productStatus:
          response.data.productStatus === 0
            ? "Mới"
            : response.data.productStatus === 1
            ? "Cũ"
            : "Không xác định",
        suitableAge: response.data.suitableAge || "Không xác định",
        price: response.data.price
          ? `${response.data.price.toLocaleString("vi-VN")} VND`
          : "Không có giá",
        description: response.data.description || "Không có mô tả",
        status:
          response.data.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
        lenderAvatar,
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đồ chơi:", error);
      toast.error("Không thể tải chi tiết đồ chơi!");
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem thông tin người cho mượn!");
        navigate("/login");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/User/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileData({
        ...response.data.userInfo,
        avatar:
          response.data.userInfo.avatar ||
          "https://placehold.co/100x100?text=No+Avatar",
      });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const handleMessage = async (lenderId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để nhắn tin!");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversations = response.data;
      const currentUserId = parseInt(
        localStorage.getItem("userId") || sessionStorage.getItem("userId")
      );
      const existingConversation = conversations.find(
        (convo) =>
          (convo.user1Id === lenderId && convo.user2Id === currentUserId) ||
          (convo.user2Id === lenderId && convo.user1Id === currentUserId)
      );

      let conversationId;
      if (existingConversation) {
        conversationId = existingConversation.conversationId;
      } else {
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
      }

      navigate("/message", { state: { activeConversationId: conversationId } });
    } catch (error) {
      console.error("Lỗi khi xử lý nhắn tin:", error);
      if (error.response?.status === 401) {
        toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện!"
        );
      }
    }
  };

  const handleUpdateLocation = async (newAddress) => {
    try {
      const token = getAuthToken();
      const response = await axios.put(
        `${API_BASE_URL}/User/${userId}/location`,
        { address: newAddress },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Cập nhật vị trí thành công!");
      fetchUserLocation();
    } catch (error) {
      console.error("Lỗi khi cập nhật vị trí:", error);
      toast.error("Không thể cập nhật vị trí!");
    }
  };

  return (
    <div className="home-wrapper">
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
                  loading="lazy"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
        <Container fluid className="mt-4">
          <h2 className="section-title">Đồ chơi đề xuất</h2>
          <Button
            variant="outline-primary"
            className="mb-3"
            onClick={() => {
              const newAddress = prompt("Nhập địa chỉ mới:");
              if (newAddress) handleUpdateLocation(newAddress);
            }}
          >
            Cập nhật vị trí
          </Button>
          <Row>
            {toyList.length === 0 ? (
              <Col className="text-center">
                <h5>Không có đồ chơi nào để hiển thị</h5>
              </Col>
            ) : (
              toyList.map((toy) => {
                const hasSentRequest = userRequests.some(
                  (req) => req.productId === toy.id && req.userId === userId && req.status === 0
                );
                return (
                  <Col key={toy.id} xs={12} md={4} className="mb-4">
                    <Card
                      className="toy-card"
                      onClick={() => handleViewDetail(toy.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Img
                        variant="top"
                        src={toy.image}
                        className="toy-image"
                        loading="lazy"
                        onError={(e) =>
                          (e.target.src = "https://placehold.co/300x200?text=No+Image")
                        }
                      />
                      <Card.Body>
                        <Card.Title className="toy-name">{toy.name}</Card.Title>
                        <Card.Text className="toy-price">{toy.price}</Card.Text>
                        <Card.Text className="toy-status">
                          <strong>Trạng thái: </strong>
                          <span
                            className={
                              toy.status === "Sẵn sàng cho mượn"
                                ? "available"
                                : "unavailable"
                            }
                          >
                            {toy.status}
                          </span>
                        </Card.Text>
                        <Card.Text className="toy-condition">
                          <strong>Tình trạng: </strong>
                          {toy.productStatus}
                        </Card.Text>
                        <Card.Text className="toy-distance">
                          <strong>Khoảng cách: </strong>
                          {typeof toy.distance === "number"
                            ? `${toy.distance.toFixed(2)} km`
                            : toy.distance}
                        </Card.Text>
                        <div className="lender-info d-flex align-items-center mb-2">
                          <img
                            src={toy.lenderAvatar}
                            alt="Ảnh đại diện người cho mượn"
                            className="lender-avatar"
                            loading="lazy"
                            onError={(e) =>
                              (e.target.src = "https://placehold.co/50x50?text=No+Avatar")
                            }
                          />
                          <Button
                            variant="link"
                            className="ms-2 p-0 text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(toy.lenderId);
                            }}
                          >
                            Thông tin người cho mượn
                          </Button>
                        </div>
                        <div className="toy-actions d-flex justify-content-between">
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBorrowModal(toy.id);
                            }}
                            disabled={
                              toy.status !== "Sẵn sàng cho mượn" ||
                              toy.lenderId === userId ||
                              hasSentRequest
                            }
                          >
                            {hasSentRequest ? "Đã gửi yêu cầu" : "Mượn"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessage(toy.lenderId);
                            }}
                            disabled={toy.lenderId === userId}
                          >
                            Nhắn tin
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
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
            <Button
              variant="primary"
              onClick={handleSendRequest}
              disabled={isSending}
            >
              {isSending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết đồ chơi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedToy && (
              <>
                <img
                  src={selectedToy.image}
                  alt={selectedToy.name}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                  onError={(e) =>
                    (e.target.src = "https://placehold.co/300x200?text=No+Image")
                  }
                />
                <h5 className="mt-3">{selectedToy.name}</h5>
                <p>
                  <strong>Danh mục:</strong>{" "}
                  {selectedToy.categoryName || "Không có"}
                </p>
                <p>
                  <strong>Tình trạng:</strong>{" "}
                  {selectedToy.productStatus || "Không có"}
                </p>
                <p>
                  <strong>Độ tuổi phù hợp:</strong>{" "}
                  {selectedToy.suitableAge || "Không có"}
                </p>
                <p>
                  <strong>Giá:</strong> {selectedToy.price}
                </p>
                <p>
                  <strong>Mô tả:</strong>{" "}
                  {selectedToy.description || "Không có"}
                </p>
                <p>
                  <strong>Trạng thái:</strong> {selectedToy.status}
                </p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDetailModal(false)}
            >
              Đóng
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
                    profileData.avatar ||
                    "https://placehold.co/100x100?text=No+Avatar"
                  }
                  alt="Ảnh đại diện"
                  className="rounded-circle mb-3"
                  style={{ width: "100px", height: "100px" }}
                  loading="lazy"
                />
                <p>
                  <strong>Tên:</strong> {profileData.displayName || "Không có"}
                </p>
                <p>
                  <strong>Tuổi:</strong>{" "}
                  {profileData.age || "Không có thông tin"}
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
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Home;