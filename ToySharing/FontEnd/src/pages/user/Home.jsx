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
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import "./Home.scss";

// Hàm phân tích địa chỉ
const parseAddress = (address) => {
  if (!address || typeof address !== "string") {
    return { ward: "", district: "", city: "" };
  }
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part);
  let ward = "";
  let district = "";
  let city = "";
  if (parts.length >= 3) {
    ward = parts[parts.length - 3];
    district = parts[parts.length - 2];
    city = parts[parts.length - 1];
  } else if (parts.length === 2) {
    district = parts[0];
    city = parts[1];
  } else if (parts.length === 1) {
    city = parts[0];
  }
  return { ward, district, city };
};

// Component FilterPanel
const FilterPanel = ({ showFilter, onToggle, filterValues, onChange, categories }) => {
  return (
    <div className={`filter-panel ${showFilter ? "show" : ""}`}>
      <Button variant="outline-primary" onClick={onToggle} className="action-btn mb-2">
        {showFilter ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
      </Button>
      {showFilter && (
        <Form className="filter-form">
          <Row className="align-items-end">
            <Col xs={12} md={3} lg={2} className="mb-2">
              <Form.Group controlId="filterName">
                <Form.Label>Tên đồ chơi</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={filterValues.name}
                  onChange={onChange}
                  placeholder="Nhập tên đồ chơi"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={3} lg={2} className="mb-2">
              <Form.Group controlId="filterCondition">
                <Form.Label>Tình trạng</Form.Label>
                <Form.Control
                  as="select"
                  name="condition"
                  value={filterValues.condition}
                  onChange={onChange}
                >
                  <option value="">Tất cả</option>
                  <option value="Mới">Mới</option>
                  <option value="Cũ">Cũ</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col xs={12} md={3} lg={2} className="mb-2">
              <Form.Group controlId="filterCategory">
                <Form.Label>Danh mục</Form.Label>
                <Form.Control
                  as="select"
                  name="category"
                  value={filterValues.category}
                  onChange={onChange}
                >
                  <option value="">Tất cả</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col xs={12} md={3} lg={2} className="mb-2">
              <Form.Group controlId="filterAgeRange">
                <Form.Label>Độ tuổi</Form.Label>
                <Form.Control
                  as="select"
                  name="ageRange"
                  value={filterValues.ageRange}
                  onChange={onChange}
                >
                  <option value="">Tất cả</option>
                  <option value="0-3">0-3 tuổi</option>
                  <option value="4-7">4-7 tuổi</option>
                  <option value="8-12">8-12 tuổi</option>
                  <option value="12+">12+ tuổi</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col xs={12} md={3} lg={2} className="mb-2">
              <Form.Group controlId="filterPriceSort">
                <Form.Label>Sắp xếp theo giá</Form.Label>
                <Form.Control
                  as="select"
                  name="priceSort"
                  value={filterValues.priceSort}
                  onChange={onChange}
                >
                  <option value="">Mặc định</option>
                  <option value="asc">Thấp đến cao</option>
                  <option value="desc">Cao đến thấp</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      )}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [toyList, setToyList] = useState([]);
  const [filteredToyList, setFilteredToyList] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowDuration, setBorrowDuration] = useState("1");
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRequests, setUserRequests] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [bannerList, setBannerList] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState({
    name: "",
    condition: "",
    category: "",
    ageRange: "",
    priceSort: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false); // Initialize loading as false
  const [showUpdateLocationModal, setShowUpdateLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({
    ward: "",
    district: "",
    city: "",
  });

  const unreadMessages = 3;
  const notificationCount = 2;
  const API_BASE_URL = "https://localhost:7128/api";

  const durationOptions = [
    { value: "1", label: "1 ngày" },
    { value: "3", label: "3 ngày" },
    { value: "7", label: "7 ngày" },
  ];

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
    if (token) {
      fetchUserLocation();
    } else {
      // Fetch toy list immediately for non-logged-in users
      fetchToyList();
    }
  }, []);

  useEffect(() => {
    if (userAddress) {
      const parsed = parseAddress(userAddress);
      setLocationForm({
        ward: parsed.ward,
        district: parsed.district,
        city: parsed.city,
      });
    }
  }, [userAddress]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/Products/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
        toast.error("Không thể tải danh mục!");
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchToyList();
    }
  }, [isLoggedIn, userId, userLocation]);

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

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/banners`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        setBannerList(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách banner:", error);
        toast.error("Không thể tải banner!");
        setBannerList([]);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const uniqueLenderIds = Array.from(
      new Set(toyList.map((t) => t.lenderId).filter((id) => id && !userNames[id]))
    );
    uniqueLenderIds.forEach(async (lenderId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${lenderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [lenderId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${lenderId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [lenderId]: "Không xác định",
        }));
      }
    });
  }, [toyList]);

  const fetchUserLocation = async () => {
    const token = getAuthToken();
    if (!token) {
      console.log("No token found, skipping fetchUserLocation");
      setUserLocation(null);
      setUserAddress(null);
      return;
    }
    try {
      console.log("Fetching user location...");
      const response = await axios.get(`${API_BASE_URL}/User/current/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { address, latitude, longitude } = response.data;
      console.log("User location response:", { address, latitude, longitude });

      if (
        latitude &&
        longitude &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude !== 0 &&
        longitude !== 0
      ) {
        setUserLocation({ latitude, longitude });
        setUserAddress(address || "Địa chỉ không được cung cấp");
        console.log("User location set:", { latitude, longitude, address });
      } else {
        console.log("Invalid or missing coordinates, prompting user to update location");
        setUserLocation(null);
        setUserAddress(address || null);
        toast.warn(
          "Vị trí của bạn chưa được thiết lập. Vui lòng cập nhật vị trí để xem khoảng cách.",
          {
            autoClose: 5000,
            onClick: () => setShowUpdateLocationModal(true),
          }
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy vị trí từ database:", error);
      setUserLocation(null);
      setUserAddress(null);
      toast.warn(
        "Không thể lấy vị trí của bạn. Vui lòng cập nhật vị trí để xem khoảng cách.",
        {
          autoClose: 5000,
          onClick: () => setShowUpdateLocationModal(true),
        }
      );
    }
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị!");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = "Địa chỉ từ định vị";
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`,
            { headers: { "User-Agent": "ToySharingApp" } }
          );
          if (response.data && response.data.display_name) {
            address = response.data.display_name;
          }
        } catch (error) {
          console.error("Lỗi khi lấy địa chỉ từ tọa độ:", error);
        }
        try {
          const token = getAuthToken();
          if (!token) {
            toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
            return;
          }
          await axios.put(
            `${API_BASE_URL}/User/${userId}/location`,
            { address, latitude, longitude },
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
          setUserLocation({ latitude, longitude });
          setUserAddress(address);
          toast.success("Lấy vị trí thành công!");
          console.log("Location updated via geolocation:", { latitude, longitude, address });
          fetchToyList();
        } catch (error) {
          console.error("Lỗi khi cập nhật vị trí:", error);
          toast.error("Không thể cập nhật vị trí!");
        }
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí hiện tại:", error);
        toast.error("Không thể lấy vị trí hiện tại!");
      }
    );
  };

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target;
    setLocationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitLocation = async () => {
    const { ward, district, city } = locationForm;
    if (!ward || !district || !city) {
      toast.error("Vui lòng nhập đầy đủ Phường, Quận và Thành phố!");
      return;
    }
    const fullAddress = `${ward}, ${district}, ${city}`;
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
        setShowUpdateLocationModal(false);
        return;
      }
      let latitude = null;
      let longitude = null;
      try {
        const encodedAddress = encodeURIComponent(fullAddress);
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=jsonv2`,
          { headers: { "User-Agent": "ToySharingApp" } }
        );
        if (response.data && response.data.length > 0) {
          const { lat, lon } = response.data[0];
          if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
            latitude = parseFloat(lat);
            longitude = parseFloat(lon);
          }
        }
      } catch (error) {
        console.error(`Lỗi khi lấy tọa độ cho địa chỉ ${fullAddress}:`, error);
      }

      await axios.put(
        `${API_BASE_URL}/User/${userId}/location`,
        { address: fullAddress, latitude, longitude },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Cập nhật vị trí thành công!");
      setUserAddress(fullAddress);
      if (latitude && longitude) {
        setUserLocation({ latitude, longitude });
      } else {
        setUserLocation(null);
        toast.warn(
          "Không thể lấy tọa độ cho địa chỉ. Vui lòng thử lại hoặc sử dụng vị trí hiện tại.",
          {
            autoClose: 5000,
            onClick: () => setShowUpdateLocationModal(true),
          }
        );
      }
      setShowUpdateLocationModal(false);
      setLocationForm({ ward: "", district: "", city: "" });
      fetchToyList();
    } catch (error) {
      console.error("Lỗi khi cập nhật vị trí:", error);
      toast.error(error.response?.data.message || "Không thể cập nhật vị trí!");
    }
  };

  const fetchToyList = async () => {
    // Only show loading spinner for logged-in users
    if (isLoggedIn) {
      setLoading(true);
    }
    try {
      const token = getAuthToken();
      console.log("Fetching toy list with token:", !!token, "userLocation:", userLocation);
      const response = await axios.get(`${API_BASE_URL}/Products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!Array.isArray(response.data)) {
        console.error("Dữ liệu API không phải mảng:", response.data);
        setToyList([]);
        setFilteredToyList([]);
        return;
      }

      const formattedToys = await Promise.all(
        response.data
          .filter((toy) => toy.available === 0 && toy.userId !== userId)
          .map(async (toy) => {
            let distance = isLoggedIn ? null : "Vui lòng đăng nhập để biết khoảng cách";
            let lenderAvatar = toy.user?.avatar || "https://via.placeholder.com/50?text=Avatar";

            // Fetch lender avatar if not provided
            if (!toy.user?.avatar && toy.userId) {
              try {
                const profileResponse = await axios.get(
                  `${API_BASE_URL}/User/profile/${toy.userId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                lenderAvatar =
                  profileResponse.data.userInfo?.avatar ||
                  "https://via.placeholder.com/50?text=Avatar";
              } catch (error) {
                console.error(`Lỗi khi lấy avatar của user ${toy.userId}:`, error);
              }
            }

            // Calculate distance only if logged in
            if (isLoggedIn) {
              let ownerLatitude, ownerLongitude;
              try {
                const ownerLocationResponse = await axios.get(
                  `${API_BASE_URL}/User/${toy.userId}/location`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                ownerLatitude = ownerLocationResponse.data.latitude;
                ownerLongitude = ownerLocationResponse.data.longitude;
                console.log(`Owner location for toy ${toy.productId}:`, {
                  ownerLatitude,
                  ownerLongitude,
                });
              } catch (error) {
                console.error(`Lỗi khi lấy vị trí của user ${toy.userId}:`, error);
                distance = "Chưa xác định vị trí của người sở hữu";
                return {
                  ...toy,
                  distance,
                  lenderAvatar,
                };
              }

              if (!ownerLatitude || !ownerLongitude) {
                console.log(`Missing owner coordinates for toy ${toy.productId}`);
                distance = "Chưa xác định vị trí của người sở hữu";
                return {
                  ...toy,
                  distance,
                  lenderAvatar,
                };
              }

              if (userLocation && userLocation.latitude && userLocation.longitude) {
                try {
                  console.log(
                    `Calculating distance for toy ${toy.productId} with userLocation:`,
                    userLocation
                  );
                  const distResponse = await axios.get(
                    `${API_BASE_URL}/User/distance-to-product/${toy.productId}?myLatitude=${userLocation.latitude}&myLongitude=${userLocation.longitude}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  const distanceKilometers = distResponse.data.distanceKilometers;
                  console.log(`Distance response for toy ${toy.productId}:`, distanceKilometers);
                  distance =
                    typeof distanceKilometers === "number" && !isNaN(distanceKilometers)
                      ? distanceKilometers
                      : "Không thể tính khoảng cách";
                } catch (error) {
                  console.error(`Lỗi khi tính khoảng cách cho sản phẩm ${toy.productId}:`, error);
                  distance = "Không thể tính khoảng cách";
                }
              } else {
                console.log("User location not available for distance calculation");
                distance = "Chưa xác định vị trí của bạn";
              }
            }

            return {
              id: toy.productId,
              image:
                toy.imagePaths && toy.imagePaths.length > 0
                  ? toy.imagePaths[0]
                  : "https://via.placeholder.com/300x200?text=No+Image",
              name: toy.name || "Không có tên",
              price: parseFloat(toy.price) || 0,
              priceString: toy.price ? `${toy.price.toLocaleString("vi-VN")} VND` : "Không có giá",
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

      console.log("Formatted toys:", formattedToys);
      setToyList(formattedToys);
      setFilteredToyList(formattedToys);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đồ chơi:", error);
      toast.error("Không thể tải danh sách đồ chơi!");
      setToyList([]);
      setFilteredToyList([]);
    } finally {
      if (isLoggedIn) {
        setLoading(false);
      }
    }
  };

  const handleBannerClick = (linkUrl) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith("http")) {
      window.location.href = linkUrl;
    } else {
      navigate(linkUrl);
    }
  };

  const handleOpenBorrowModal = (toyId) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để mượn đồ chơi!");
      navigate("/login");
      return;
    }
    setSelectedToyId(toyId);
    setBorrowDuration("1");
    setNote("");
    setShowBorrowModal(true);
  };

  const handleCloseBorrowModal = () => {
    setShowBorrowModal(false);
    setBorrowDuration("1");
    setNote("");
    setSelectedToyId(null);
  };

  const handleSendRequest = async () => {
    if (isSending) return;
    if (!borrowDuration) {
      toast.error("Vui lòng chọn thời gian mượn!");
      return;
    }

    setIsSending(true);
    const token = getAuthToken();

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

    const today = new Date();
    const rentDate = today;
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + parseInt(borrowDuration));

    const formData = new FormData();
    formData.append("ProductId", selectedToyId);
    formData.append("RequestDate", today.toISOString());
    formData.append("RentDate", rentDate.toISOString());
    formData.append("ReturnDate", returnDate.toISOString());
    formData.append("Message", note || "");

    try {
      const response = await axios.post(`${API_BASE_URL}/Requests`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setToyList((prevList) => prevList.filter((toy) => toy.id !== selectedToyId));
      setFilteredToyList((prevList) => prevList.filter((toy) => toy.id !== selectedToyId));
      setUserRequests((prev) => [...prev, response.data]);
      toast.success("Gửi yêu cầu mượn thành công!");
      handleCloseBorrowModal();
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu mượn:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu mượn!");
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

      let lenderAvatar = response.data.user?.avatar || "https://via.placeholder.com/50?text=Avatar";
      if (!response.data.user?.avatar && response.data.userId) {
        try {
          const profileResponse = await axios.get(
            `${API_BASE_URL}/User/profile/${response.data.userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          lenderAvatar =
            profileResponse.data.userInfo?.avatar ||
            "https://via.placeholder.com/50?text=Avatar";
        } catch (error) {
          console.error(`Lỗi khi lấy avatar của user ${response.data.userId}:`, error);
        }
      }

      setSelectedToy({
        id: response.data.productId,
        image:
          response.data.imagePaths && response.data.imagePaths.length > 0
            ? response.data.imagePaths[0]
            : "https://via.placeholder.com/300x200?text=No+Image",
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
        status: response.data.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
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
      const userInfo = response.data.userInfo || response.data;
      setProfileData({
        ...userInfo,
        avatar: userInfo.avatar || "https://via.placeholder.com/100?text=Avatar",
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
      const response = await axios.post(
        `${API_BASE_URL}/Conversations`,
        { user2Id: lenderId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const conversationId = response.data.conversationId;
      navigate("/message", { state: { activeConversationId: conversationId } });
    } catch (error) {
      console.error("Lỗi khi xử lý nhắn tin:", error);
      toast.error("Không thể bắt đầu cuộc trò chuyện!");
    }
  };

  const applyFilters = () => {
    let filtered = toyList.filter((toy) => {
      const matchesName = filterValues.name
        ? toy.name.toLowerCase().includes(filterValues.name.toLowerCase())
        : true;
      const matchesCondition = filterValues.condition
        ? toy.productStatus === filterValues.condition
        : true;
      const matchesCategory = filterValues.category
        ? toy.categoryName === filterValues.category
        : true;
      const matchesAgeRange = filterValues.ageRange
        ? (() => {
            const age = parseInt(toy.suitableAge);
            switch (filterValues.ageRange) {
              case "0-3":
                return age >= 0 && age <= 3;
              case "4-7":
                return age >= 4 && age <= 7;
              case "8-12":
                return age >= 8 && age <= 12;
              case "12+":
                return age >= 12;
              default:
                return true;
            }
          })()
        : true;
      return matchesName && matchesCondition && matchesCategory && matchesAgeRange;
    });

    if (filterValues.priceSort === "asc") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (filterValues.priceSort === "desc") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredToyList(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filterValues, toyList]);

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
            {bannerList.map((banner) => (
              <Carousel.Item key={banner.bannerId}>
                <div
                  className="banner-clickable"
                  onClick={() => handleBannerClick(banner.linkUrl)}
                  style={{ cursor: banner.linkUrl ? "pointer" : "default" }}
                >
                  <img
                    className="d-block w-100 banner-image"
                    src={banner.imageUrl}
                    alt={banner.title}
                    loading="lazy"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/1200x400?text=No+Banner")
                    }
                  />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
        <Container fluid className="mt-4 main-content">
          <Row className="mb-3 align-items-center">
            <Col xs={12} md={12}>
              <h2 className="section-title">Đồ chơi đề xuất</h2>
            </Col>
          </Row>
          <Row className="filter-and-actions mb-3">
            <Col xs={12} md={12}>
              <div className="action-buttons d-flex align-items-center mb-3">
                <Button
                  variant="outline-primary"
                  className="action-btn me-2"
                  onClick={handleGetCurrentLocation}
                  disabled={!isLoggedIn}
                >
                  Lấy vị trí hiện tại
                </Button>
                <Button
                  variant="outline-primary"
                  className="action-btn"
                  onClick={() => setShowUpdateLocationModal(true)}
                  disabled={!isLoggedIn}
                >
                  Cập nhật vị trí
                </Button>
              </div>
              <FilterPanel
                showFilter={showFilter}
                onToggle={() => setShowFilter(!showFilter)}
                filterValues={filterValues}
                onChange={(e) =>
                  setFilterValues({ ...filterValues, [e.target.name]: e.target.value })
                }
                categories={categories}
              />
            </Col>
          </Row>
          {loading && isLoggedIn ? (
            <div className="text-center mt-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : filteredToyList.length === 0 ? (
            <div className="text-center mt-5">
              <p className="no-results">Không có đồ chơi nào để hiển thị.</p>
            </div>
          ) : (
            <>
              <Row>
                {filteredToyList.map((toy) => {
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
                        <div className="image-frame">
                          <Card.Img
                            variant="top"
                            src={toy.image}
                            className="toy-image"
                            loading="lazy"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                        </div>
                        <Card.Body>
                          <Card.Title className="toy-name">{toy.name}</Card.Title>
                          <Card.Text className="toy-price">{toy.priceString}</Card.Text>
                          <Card.Text className="toy-status">
                            <strong>Trạng thái: </strong>
                            <span className="available">{toy.status}</span>
                          </Card.Text>
                          <Card.Text className="toy-condition">
                            <strong>Tình trạng: </strong>
                            {toy.productStatus}
                          </Card.Text>
                          <Card.Text className="toy-distance">
                            <strong>Khoảng cách: </strong>
                            {typeof toy.distance === "number" && !isNaN(toy.distance)
                              ? `${toy.distance.toFixed(2)} km`
                              : toy.distance || "Không xác định"}
                          </Card.Text>
                          <div className="lender-info d-flex align-items-center mb-2">
                            <img
                              src={toy.lenderAvatar}
                              alt="Ảnh đại diện người cho mượn"
                              className="lender-avatar"
                              loading="lazy"
                              onError={(e) =>
                                (e.target.src = "https://via.placeholder.com/50?text=Avatar")
                              }
                            />
                            <Button
                              variant="link"
                              className="lender-link ms-2 p-0 text-decoration-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(toy.lenderId);
                              }}
                            >
                              {userNames[toy.lenderId] || "Đang tải..."}
                            </Button>
                          </div>
                          <div className="toy-actions d-flex justify-content-between">
                            <Button
                              variant="primary"
                              className="action-btn"
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
                              className="action-btn"
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
                })}
              </Row>
              <div className="text-center mt-4">
                <Button variant="outline-primary" className="view-more-btn action-btn">
                  Xem thêm
                </Button>
              </div>
            </>
          )}
          <Footer />
        </Container>
        <Modal show={showBorrowModal} onHide={handleCloseBorrowModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Nhập thông tin mượn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="borrowDuration" className="mb-3">
                <Form.Label>Thời gian mượn</Form.Label>
                <Form.Control
                  as="select"
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(e.target.value)}
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Control>
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
            <Button variant="secondary" className="action-btn" onClick={handleCloseBorrowModal}>
              Quay lại
            </Button>
            <Button
              variant="primary"
              className="action-btn"
              onClick={handleSendRequest}
              disabled={isSending}
            >
              {isSending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết đồ chơi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedToy && (
              <>
                <div className="image-frame">
                  <img
                    src={selectedToy.image}
                    alt={selectedToy.name}
                    className="detail-image"
                    loading="lazy"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                    }
                  />
                </div>
                <h5 className="mt-3">{selectedToy.name}</h5>
                <p><strong>Danh mục:</strong> {selectedToy.categoryName || "Không có"}</p>
                <p><strong>Tình trạng:</strong> {selectedToy.productStatus || "Không có"}</p>
                <p><strong>Độ tuổi phù hợp:</strong> {selectedToy.suitableAge || "Không có"}</p>
                <p><strong>Giá:</strong> {selectedToy.price}</p>
                <p><strong>Mô tả:</strong> {selectedToy.description || "Không có"}</p>
                <p><strong>Trạng thái:</strong> {selectedToy.status}</p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="action-btn"
              onClick={() => setShowDetailModal(false)}
            >
              Đóng
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
                  src={profileData.avatar}
                  alt="Ảnh đại diện"
                  className="rounded-circle mb-3"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  loading="lazy"
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/100?text=Avatar")
                  }
                />
                <p><strong>Tên hiển thị:</strong> {profileData.displayName || "Không có tên"}</p>
                <p><strong>Tuổi:</strong> {profileData.age || "Không có thông tin"}</p>
                <p><strong>Địa chỉ:</strong> {profileData.address || "Không có thông tin"}</p>
                <p>
                  <strong>Đánh giá:</strong>{" "}
                  {profileData.rating ? profileData.rating.toFixed(2) : "Chưa có đánh giá"}
                </p>
              </div>
            ) : (
              <p>Đang tải thông tin...</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="action-btn"
              onClick={() => setShowProfileModal(false)}
            >
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showUpdateLocationModal}
          onHide={() => setShowUpdateLocationModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Cập nhật vị trí</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="ward" className="mb-3">
                <Form.Label>
                  Phường <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="ward"
                  value={locationForm.ward}
                  onChange={handleLocationFormChange}
                  placeholder="Ví dụ: Văn Quán"
                  required
                />
              </Form.Group>
              <Form.Group controlId="district" className="mb-3">
                <Form.Label>
                  Quận <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="district"
                  value={locationForm.district}
                  onChange={handleLocationFormChange}
                  placeholder="Ví dụ: Hà Đông"
                  required
                />
              </Form.Group>
              <Form.Group controlId="city" className="mb-3">
                <Form.Label>
                  Thành phố <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={locationForm.city}
                  onChange={handleLocationFormChange}
                  placeholder="Ví dụ: Hà Nội"
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="action-btn"
              onClick={() => setShowUpdateLocationModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              className="action-btn"
              onClick={handleSubmitLocation}
            >
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Home;
