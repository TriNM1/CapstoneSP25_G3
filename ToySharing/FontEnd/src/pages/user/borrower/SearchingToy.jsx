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
  const [userAddress, setUserAddress] = useState(null);
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
    if (!token) {
      setUserLocation(null);
      setUserAddress(null);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setUserAddress(null);
        },
        async (error) => {
          console.error("Lỗi khi lấy vị trí từ Geolocation:", error);
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
      const response = await axios.get(`${API_BASE_URL}/User/current/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.address) {
        setUserAddress(response.data.address);
        setUserLocation(null);
      } else {
        setUserAddress(null);
        setUserLocation(null);
        toast.warn("Vị trí của bạn chưa được xác định trong hồ sơ.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy địa chỉ từ database:", error);
      setUserAddress(null);
      setUserLocation(null);
      toast.error("Không thể lấy địa chỉ từ hồ sơ người dùng.");
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

  useEffect(() => {
    const fetchToys = async () => {
      try {
        const token = getAuthToken();
        if (!token || !mainUserId) return;

        const response = await axios.get(`${API_BASE_URL}/Products/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedToys = await Promise.all(
          response.data.map(async (toy) => {
            let distance;

            if (!isLoggedIn) {
              distance = "Vui lòng đăng nhập để biết khoảng cách";
            } else {
              let ownerAddress;
              try {
                const ownerLocationResponse = await axios.get(
                  `${API_BASE_URL}/User/${toy.userId}/location`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                ownerAddress = ownerLocationResponse.data.address;
              } catch (error) {
                console.error(`Lỗi khi lấy địa chỉ chủ sở hữu ${toy.userId}:`, error);
                distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
                return { ...toy, distance };
              }

              if (!ownerAddress) {
                distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
              } else {
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
                  if (!userAddress) {
                    distance = "Chưa xác định vị trí của bạn";
                  } else {
                    const userCoords = await getCoordinatesFromAddress(userAddress);
                    const ownerCoords = await getCoordinatesFromAddress(ownerAddress);

                    if (!userCoords) {
                      distance = "Chưa xác định vị trí của bạn";
                    } else if (!ownerCoords) {
                      distance = "Chưa xác định vị trí của người sở hữu đồ chơi";
                    } else {
                      try {
                        const distResponse = await axios.get(
                          `${API_BASE_URL}/User/distance-to-product/${toy.productId}?myLatitude=${userCoords.latitude}&myLongitude=${userCoords.longitude}`,
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
                    }
                  }
                }
              }
            }

            return {
              productId: toy.productId,
              userId: toy.userId,
              image:
                toy.imagePaths && toy.imagePaths.length > 0
                  ? toy.imagePaths[0]
                  : "https://via.placeholder.com/300x200?text=No+Image",
              name: toy.name,
              ownerAvatar: toy.ownerAvatar || "https://via.placeholder.com/50?text=Avatar",
              createdAt: new Date(toy.createdAt).toISOString().split("T")[0],
              categoryName: toy.categoryName,
              productStatus: toy.productStatus === 0 ? "Mới" : toy.productStatus === 1 ? "Cũ" : "Không xác định",
              suitableAge: toy.suitableAge,
              price: toy.price,
              description: toy.description,
              available: toy.available,
              ownerName: toy.ownerName || "Người cho mượn",
              ownerId: toy.userId,
              distance: distance,
            };
          })
        );

        setToys(formattedToys);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi:", error);
        toast.error("Không thể tải danh sách đồ chơi!");
        setToys([]);
      }
    };

    if (mainUserId) fetchToys();
  }, [mainUserId, userLocation, userAddress, isLoggedIn]);

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
      console.error("Lỗi khi gửi yêu cầu mượn:", err);
      toast.error("Lỗi khi gửi yêu cầu mượn!");
    }
  };

  const handleViewDetail = async (toyId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/Products/${toyId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedToy({
        productId: response.data.productId,
        image:
          response.data.imagePaths && response.data.imagePaths.length > 0
            ? response.data.imagePaths[0]
            : "https://via.placeholder.com/300x200?text=No+Image",
        name: response.data.name,
        categoryName: response.data.categoryName,
        productStatus: response.data.productStatus === 0 ? "Mới" : response.data.productStatus === 1 ? "Cũ" : "Không xác định",
        suitableAge: response.data.suitableAge,
        price: response.data.price,
        description: response.data.description,
        available: response.data.available,
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đồ chơi:", error);
      toast.error("Không thể tải chi tiết đồ chơi!");
    }
  };

  const handleViewProfile = async (ownerId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem thông tin người cho mượn!");
        navigate("/login");
        return;
      }
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
              {filteredToys.length === 0 ? (
                <Col className="text-center">
                  <h5>Không có đồ chơi nào để hiển thị</h5>
                </Col>
              ) : (
                filteredToys.map((toy) => {
                  const hasSentRequest = userRequests.some(
                    (req) =>
                      req.productId === toy.productId &&
                      req.userId === mainUserId &&
                      req.status === 0
                  );
                  return (
                    <Col key={toy.productId} xs={12} md={6} className="mb-4">
                      <Card
                        className="request-card"
                        onClick={() => handleViewDetail(toy.productId)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Img
                          variant="top"
                          src={toy.image}
                          className="toy-image"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
                        />
                        <Card.Body>
                          <Card.Title className="toy-name">
                            {toy.name}
                          </Card.Title>
                          <Card.Text className="send-date">
                            <strong>Ngày đăng:</strong> {toy.createdAt}
                          </Card.Text>
                          <Card.Text className="price">
                            <strong>Phí cho mượn:</strong>{" "}
                            {toy.price.toLocaleString("vi-VN")} VND
                          </Card.Text>
                          <Card.Text className="status">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                              className={
                                toy.available === 0 ? "available" : "unavailable"
                              }
                            >
                              {toy.available === 0
                                ? "Sẵn sàng cho mượn"
                                : "Đã cho mượn"}
                            </span>
                          </Card.Text>
                          <Card.Text className="distance">
                            <strong>Khoảng cách:</strong>{" "}
                            {typeof toy.distance === "number"
                              ? `${toy.distance.toFixed(2)} km`
                              : toy.distance}
                          </Card.Text>
                          <div className="lender-info d-flex align-items-center mb-2">
                            <img
                              src={toy.ownerAvatar}
                              alt="Ảnh đại diện người cho mượn"
                              className="lender-avatar"
                              onError={(e) =>
                                (e.target.src =
                                  "https://via.placeholder.com/50?text=Avatar")
                              }
                            />
                            <Button
                              variant="link"
                              className="lender-link p-0 text-decoration-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(toy.ownerId);
                              }}
                            >
                              Thông tin người cho mượn
                            </Button>
                          </div>
                          <div className="request-actions text-center">
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenBorrowModal(toy.productId);
                              }}
                              disabled={hasSentRequest}
                            >
                              {hasSentRequest ? "Đã gửi yêu cầu" : "Mượn"}
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              )}
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
                onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
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
                <strong>Phí cho mượn:</strong>{" "}
                {selectedToy.price.toLocaleString("vi-VN")} VND
              </p>
              <p>
                <strong>Mô tả:</strong>{" "}
                {selectedToy.description || "Không có"}
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {selectedToy.available === 0
                  ? "Sẵn sàng cho mượn"
                  : "Đã cho mượn"}
              </p>
              {userRequests.some(
                (req) =>
                  req.productId === selectedToy.productId && req.status === 0
              ) && (
                <p className="text-success">
                  Bạn đã gửi yêu cầu mượn cho đồ chơi này.
                </p>
              )}
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
        show={showBorrowModal}
        onHide={handleCloseBorrowModal}
        centered
      >
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
                  "https://via.placeholder.com/100?text=Avatar"
                }
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=Avatar")}
              />
              <p>
                <strong>Tên hiển thị:</strong>{" "}
                {profileData.displayName || "Không có"}
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
  );
};

export default SearchingToy;