import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Collapse,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFilter } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./SearchingToy.scss";
import Footer from "../../../components/footer";

const API_BASE_URL = "https://localhost:7128/api";

const SearchingToy = () => {
  const navigate = useNavigate();

  // State for header and active nav link
  const [activeLink, setActiveLink] = useState("searching-toy");

  // State to show/hide filter
  const [showFilter, setShowFilter] = useState(false);

  // Filter states
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [brand, setBrand] = useState("");
  const [distance, setDistance] = useState("");

  // State for toy list, categories, loading, and error
  const [toyList, setToyList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for owner profiles and distances
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [distances, setDistances] = useState({}); // Store distances for each product

  // State for user's location
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });

  // Side menu links
  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  // State for borrow modal
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("token"); // Adjust based on how you store the token
  };

  // Axios instance with default headers
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add token to requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          toast.error("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.");
          setUserLocation({ latitude: null, longitude: null });
        }
      );
    } else {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị.");
      setUserLocation({ latitude: null, longitude: null });
    }
  }, []);

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/Products/categories");
        setCategories(response.data);
      } catch (err) {
        toast.error("Lỗi khi tải danh mục!");
      }
    };

    fetchCategories();
  }, []);

  // Fetch toys, owner profiles, and distances
  useEffect(() => {
    const fetchToys = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/Products");
        const toys = response.data;

        // Fetch owner profiles for each toy
        const ownerPromises = toys.map(async (toy) => {
          if (!ownerProfiles[toy.userId]) {
            const ownerResponse = await axiosInstance.get(
              `/Products/${toy.productId}/owner`
            );
            return { userId: toy.userId, owner: ownerResponse.data };
          }
          return null;
        });

        const owners = await Promise.all(ownerPromises);
        const newOwnerProfiles = { ...ownerProfiles };
        owners.forEach((owner) => {
          if (owner) {
            newOwnerProfiles[owner.userId] = owner.owner;
          }
        });
        setOwnerProfiles(newOwnerProfiles);

        setToyList(toys);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải danh sách đồ chơi. Vui lòng thử lại sau.");
        setLoading(false);
        toast.error("Lỗi khi tải dữ liệu!");
      }
    };

    fetchToys();
  }, []);

  // Fetch distances for each toy when toys or user location changes
  useEffect(() => {
    const fetchDistances = async () => {
      if (!userLocation.latitude || !userLocation.longitude || toyList.length === 0) return;

      const distancePromises = toyList.map(async (toy) => {
        try {
          const response = await axiosInstance.get(
            `/User/distance-to-product/${toy.productId}`,
            {
              params: {
                myLatitude: userLocation.latitude,
                myLongitude: userLocation.longitude,
              },
            }
          );
          return { productId: toy.productId, distance: response.data.distanceKilometers };
        } catch (err) {
          return { productId: toy.productId, distance: null };
        }
      });

      const distanceResults = await Promise.all(distancePromises);
      const newDistances = {};
      distanceResults.forEach((result) => {
        newDistances[result.productId] = result.distance;
      });
      setDistances(newDistances);
    };

    fetchDistances();
  }, [toyList, userLocation]);

  // Handle filter submission (client-side filtering)
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    axiosInstance
      .get("/Products")
      .then((response) => {
        let filteredToys = response.data;

        // Apply filters on the client side
        if (color) {
          filteredToys = filteredToys.filter((toy) =>
            toy.description?.toLowerCase().includes(color.toLowerCase())
          );
        }
        if (condition) {
          filteredToys = filteredToys.filter(
            (toy) => toy.productStatus?.toLowerCase() === condition.toLowerCase()
          );
        }
        if (category) {
          filteredToys = filteredToys.filter(
            (toy) => toy.categoryName?.toLowerCase() === category.toLowerCase()
          );
        }
        if (ageRange) {
          const [minAge, maxAge] = ageRange.split("-").map(Number);
          filteredToys = filteredToys.filter(
            (toy) =>
              toy.suitableAge >= minAge &&
              (maxAge ? toy.suitableAge <= maxAge : true)
          );
        }
        if (brand) {
          filteredToys = filteredToys.filter((toy) =>
            toy.description?.toLowerCase().includes(brand.toLowerCase())
          );
        }
        if (distance) {
          filteredToys = filteredToys.filter((toy) => {
            const toyDistance = distances[toy.productId];
            return toyDistance !== null && toyDistance <= Number(distance);
          });
        }

        setToyList(filteredToys);
        setLoading(false);
        toast.success("Đã áp dụng bộ lọc!");
      })
      .catch((err) => {
        setError("Không thể áp dụng bộ lọc. Vui lòng thử lại.");
        setLoading(false);
        toast.error("Lỗi khi áp dụng bộ lọc!");
      });
  };

  // Open borrow modal and store selected toy ID
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

  // Handle sending borrow request (simulated for now)
  const handleSendRequest = () => {
    setToyList((prevList) =>
      prevList.filter((toy) => toy.productId !== selectedToyId)
    );
    toast.success("Gửi yêu cầu mượn thành công!");
    handleCloseBorrowModal();
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

      <Container fluid>
        <Row>
          <Col xs={12} md={2} className="side-menu">
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>

          <Col xs={12} md={9} className="main-content">
            <div className="filter-toggle mb-3">
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilter(!showFilter)}
              >
                <FaFilter /> Bộ lọc
              </Button>
            </div>

            <Collapse in={showFilter}>
              <div className="filter-panel mb-4">
                <Form onSubmit={handleFilterSubmit}>
                  <Row>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterColor">
                        <Form.Label>Màu sắc</Form.Label>
                        <Form.Control
                          as="select"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                        >
                          <option value="">Chọn màu sắc</option>
                          <option value="red">Đỏ</option>
                          <option value="blue">Xanh dương</option>
                          <option value="green">Xanh lá</option>
                          <option value="yellow">Vàng</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterCondition">
                        <Form.Label>Tình trạng</Form.Label>
                        <Form.Control
                          as="select"
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                        >
                          <option value="">Chọn tình trạng</option>
                          <option value="new">Mới</option>
                          <option value="used">Cũ</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterCategory">
                        <Form.Label>Danh mục</Form.Label>
                        <Form.Control
                          as="select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((cat, index) => (
                            <option key={index} value={cat.toLowerCase()}>
                              {cat}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterAgeRange">
                        <Form.Label>Độ tuổi</Form.Label>
                        <Form.Control
                          as="select"
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                        >
                          <option value="">Chọn độ tuổi</option>
                          <option value="0-3">0-3</option>
                          <option value="4-6">4-6</option>
                          <option value="7-9">7-9</option>
                          <option value="10+">10+</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterBrand">
                        <Form.Label>Thương hiệu</Form.Label>
                        <Form.Control
                          as="select"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        >
                          <option value="">Chọn thương hiệu</option>
                          <option value="brandA">Brand A</option>
                          <option value="brandB">Brand B</option>
                          <option value="brandC">Brand C</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                      <Form.Group controlId="filterDistance">
                        <Form.Label>Khoảng cách</Form.Label>
                        <Form.Control
                          as="select"
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
                        >
                          <option value="">Chọn khoảng cách</option>
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="15">15 km</option>
                          <option value="20">20 km</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" type="submit">
                    Áp dụng bộ lọc
                  </Button>
                </Form>
              </div>
            </Collapse>

            {loading ? (
              <div className="text-center">
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="text-center text-danger">
                <p>{error}</p>
              </div>
            ) : toyList.length === 0 ? (
              <div className="text-center">
                <p>Không tìm thấy đồ chơi nào.</p>
              </div>
            ) : (
              <Row>
                {toyList.map((toy) => (
                  <Col key={toy.productId} xs={12} md={6} className="mb-4">
                    <Card className="toy-card">
                      <Card.Img
                        variant="top"
                        src={
                          toy.imagePaths && toy.imagePaths.length > 0
                            ? `${API_BASE_URL}${toy.imagePaths[0]}`
                            : "https://via.placeholder.com/200"
                        }
                        className="toy-image"
                      />
                      <Card.Body>
                        <Card.Title className="toy-name">{toy.name}</Card.Title>
                        <Card.Text className="toy-price">
                          {toy.price.toLocaleString("vi-VN")} VND
                        </Card.Text>
                        <Card.Text className="toy-status">
                          <strong>Trạng thái: </strong>
                          <span
                            className={
                              toy.available === 0 ? "available" : "unavailable"
                            }
                          >
                            {toy.available === 0 ? "Còn trống" : "Hết đồ"}
                          </span>
                        </Card.Text>
                        <Card.Text className="toy-distance">
                          <strong>Khoảng cách: </strong>
                          {distances[toy.productId] !== undefined
                            ? distances[toy.productId] !== null
                              ? `${distances[toy.productId].toFixed(1)} km`
                              : "Không xác định"
                            : "Đang tính..."}
                        </Card.Text>
                        <div className="lender-info d-flex align-items-center justify-content-center mb-2">
                          <img
                            src={
                              ownerProfiles[toy.userId]?.avatar ||
                              "https://via.placeholder.com/35"
                            }
                            alt="Lender Avatar"
                            className="lender-avatar"
                          />
                          <a
                            className="lender-link ms-2"
                            href={`/userinfor/${toy.userId}`}
                            id="trangcanhanlink"
                          >
                            Trang cá nhân người cho mượn
                          </a>
                        </div>
                        <div className="toy-actions d-flex justify-content-center gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleOpenBorrowModal(toy.productId)}
                            disabled={toy.available !== 0}
                          >
                            Mượn
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => navigate("/message")}
                          >
                            Nhắn tin
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            <div className="text-center">
              <Button variant="outline-primary" className="view-more-btn">
                Xem thêm
              </Button>
            </div>
          </Col>
        </Row>
        <Footer/>
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
                className="form-control date-picker-input"
                placeholderText="Chọn ngày bắt đầu"
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