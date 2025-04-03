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
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import toy1 from "../../../assets/toy1.jpg";
import userAvatar from "../../../assets/user.png";
import "./UserInfor.scss";
import Footer from "../../../components/footer";
import axios from "axios";

const UserInfor = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Lấy userId từ URL params

  // State cho header active link
  const [activeLink, setActiveLink] = useState("user-info");

  // State cho thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    name: "",
    age: 0,
    distance: null,
    address: "",
    avatar: "",
    reputation: 0,
    gender: null,
  });

  // State cho danh sách đồ chơi
  const [toyList, setToyList] = useState([]);
  const [filteredToyList, setFilteredToyList] = useState([]); // Danh sách đồ chơi sau khi lọc
  const [noToysMessage, setNoToysMessage] = useState("");

  // State cho loading
  const [loading, setLoading] = useState(true);

  // State cho bộ lọc
  const [showFilter, setShowFilter] = useState(false);
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [brand, setBrand] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");

  // State cho modal mượn đồ chơi
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowStart, setBorrowStart] = useState(null);
  const [borrowEnd, setBorrowEnd] = useState(null);
  const [note, setNote] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  const API_BASE_URL = "https://localhost:7128/api";

  // Fetch thông tin người dùng và danh sách đồ chơi
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Vui lòng đăng nhập để xem thông tin người dùng!");
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/Users/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const { userInfo: data, distance } = response.data;
        setUserInfo({
          name: data.name || "Không xác định",
          age: data.age || 0,
          distance: distance,
          address: data.address || "Chưa cung cấp địa chỉ",
          avatar: data.avatar || userAvatar,
          reputation: data.rating || 0,
          gender: data.gender,
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        toast.error("Không thể tải thông tin người dùng.");
      }
    };

    const fetchUserToys = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/Products/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const products = response.data;

        // Lọc danh sách đồ chơi theo userId
        const userToys = products.filter(
          (product) => product.userId === parseInt(userId)
        );

        if (userToys.length === 0) {
          setNoToysMessage("Người dùng này chưa đăng đồ chơi nào.");
          setToyList([]);
          setFilteredToyList([]);
        } else {
          const mappedToys = userToys.map((product) => ({
            id: product.productId,
            image:
              product.imagePaths && product.imagePaths.length > 0
                ? product.imagePaths[0]
                : toy1,
            name: product.name || "Không xác định",
            status: product.available === 0 ? "Còn trống" : "Hết đồ",
            price: `${product.price.toLocaleString("vi-VN")} VND`,
            category: product.categoryName || "",
            condition: product.productStatus || "",
            suitableAge: product.suitableAge || 0,
          }));
          setToyList(mappedToys);
          setFilteredToyList(mappedToys);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi:", error);
        setNoToysMessage("Người dùng này chưa đăng đồ chơi nào.");
        setToyList([]);
        setFilteredToyList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserToys();
  }, [userId, navigate]);

  // Xử lý bộ lọc
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    let filtered = [...toyList];

    if (category) {
      filtered = filtered.filter(
        (toy) => toy.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (condition) {
      filtered = filtered.filter(
        (toy) => toy.condition.toLowerCase() === condition.toLowerCase()
      );
    }

    if (ageRange) {
      const [minAge, maxAge] = ageRange.split("-").map(Number);
      filtered = filtered.filter((toy) => {
        const age = toy.suitableAge;
        if (maxAge) {
          return age >= minAge && age <= maxAge;
        }
        return age >= minAge;
      });
    }

    if (distanceFilter) {
      const maxDistance = parseFloat(distanceFilter);
      if (userInfo.distance != null) {
        filtered = userInfo.distance <= maxDistance ? filtered : [];
      }
    }

    // Các bộ lọc khác (color, brand) chưa được triển khai trong API, có thể bỏ qua hoặc thêm logic giả lập
    setFilteredToyList(filtered);

    if (filtered.length === 0) {
      setNoToysMessage("Không tìm thấy đồ chơi phù hợp với bộ lọc.");
    } else {
      setNoToysMessage("");
    }
  };

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
    try {
      const token = localStorage.getItem("token");
      const requestData = {
        productId: selectedToyId,
        message: note,
        requestDate: new Date().toISOString(),
        rentDate: borrowStart ? borrowStart.toISOString() : null,
        returnDate: borrowEnd ? borrowEnd.toISOString() : null,
      };

      const response = await axios.post(
        `${API_BASE_URL}/Requests`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setToyList((prevList) =>
          prevList.map((toy) =>
            toy.id === selectedToyId ? { ...toy, status: "Hết đồ" } : toy
          )
        );
        setFilteredToyList((prevList) =>
          prevList.map((toy) =>
            toy.id === selectedToyId ? { ...toy, status: "Hết đồ" } : toy
          )
        );
        toast.success("Gửi yêu cầu mượn thành công!");
        handleCloseBorrowModal();
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu mượn:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể gửi yêu cầu mượn. Vui lòng thử lại."
      );
    }
  };

  // Hàm chuyển đổi giới tính
  const getGenderText = (gender) => {
    if (gender === null || gender === undefined) return "Chưa xác định";
    return gender ? "Nam" : "Nữ";
  };

  return (
    <div className="user-infor-page home-page">
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
            <SideMenu
              menuItems={[
                { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
                { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
                { id: 3, label: "Đang cho mượn", link: "/inlending" },
                {
                  id: 4,
                  label: "Danh sách muốn mượn",
                  link: "/listborrowrequests",
                },
                { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
              ]}
              activeItem={-1} // Không có mục nào được chọn
            />
          </Col>

          <Col xs={12} md={10} className="main-content">
            {/* Phần thông tin người dùng */}
            <Row className="user-info-section mb-4 align-items-center">
              <Col xs={12} md={4} className="text-center">
                <img
                  src={userInfo.avatar}
                  alt="User Avatar"
                  className="user-avatar"
                />
              </Col>
              <Col xs={12} md={8}>
                <Row className="user-details">
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Tên:</strong> {userInfo.name}
                    </p>
                  </Col>
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Tuổi:</strong> {userInfo.age}
                    </p>
                  </Col>
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Giới tính:</strong>{" "}
                      {getGenderText(userInfo.gender)}
                    </p>
                  </Col>
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Khoảng cách:</strong>{" "}
                      {userInfo.distance != null
                        ? `${userInfo.distance} km`
                        : "Không xác định"}
                    </p>
                  </Col>
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Địa chỉ:</strong> {userInfo.address}
                    </p>
                  </Col>
                  <Col xs={12} sm={6}>
                    <p>
                      <strong>Uy tín:</strong>{" "}
                      <span
                        className={`reputation ${
                          userInfo.reputation > 4 ? "high" : ""
                        }`}
                      >
                        {userInfo.reputation.toFixed(1)}/5
                      </span>
                    </p>
                  </Col>
                </Row>
                <div className="user-actions mt-3">
                  <Button
                    variant="primary"
                    onClick={() =>
                      alert("Chức năng đánh giá sắp ra mắt!")
                    }
                  >
                    Đánh giá
                  </Button>
                  <Button
                    variant="secondary"
                    className="ms-2"
                    onClick={() => navigate(`/message/${userId}`)}
                  >
                    Nhắn tin
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Phần bộ lọc */}
            <Row className="mb-3">
              <Col xs={12}>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  {showFilter ? "Đóng bộ lọc" : "Mở bộ lọc"}
                </Button>
                <Collapse in={showFilter}>
                  <div className="filter-panel mt-3">
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
                              <option value="Xe">Xe</option>
                              <option value="Robot">Robot</option>
                              <option value="Búp bê">Búp bê</option>
                              <option value="Khối xếp hình">Khối xếp hình</option>
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
                              value={distanceFilter}
                              onChange={(e) => setDistanceFilter(e.target.value)}
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
              </Col>
            </Row>

            {/* Phần danh sách đồ chơi */}
            {loading ? (
              <Row>
                <Col className="text-center">
                  <p>Đang tải...</p>
                </Col>
              </Row>
            ) : noToysMessage ? (
              <Row>
                <Col className="text-center">
                  <p>{noToysMessage}</p>
                </Col>
              </Row>
            ) : (
              <>
                <Row className="toy-items-section">
                  {filteredToyList.map((toy) => (
                    <Col key={toy.id} xs={12} md={4} className="mb-4">
                      <Card className="toy-card">
                        <Card.Img
                          variant="top"
                          src={toy.image}
                          className="toy-image"
                        />
                        <Card.Body className="text-center">
                          <Card.Title className="toy-name">{toy.name}</Card.Title>
                          <Card.Text className="toy-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                              className={
                                toy.status === "Còn trống"
                                  ? "available"
                                  : "unavailable"
                              }
                            >
                              {toy.status}
                            </span>
                          </Card.Text>
                          <Card.Text className="toy-price">
                            <strong>Giá:</strong> {toy.price}
                          </Card.Text>
                          <div className="toy-actions">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() => handleOpenBorrowModal(toy.id)}
                              disabled={toy.status !== "Còn trống"}
                            >
                              Mượn
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {filteredToyList.length > 0 && (
                  <div className="text-center">
                    <Button variant="outline-primary" className="view-more-btn">
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
        <Footer/>
      </Container>

      {/* Modal Nhập thông tin mượn */}
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
          <Button
            variant="primary"
            onClick={handleSendRequest}
            disabled={!borrowStart || !borrowEnd}
          >
            Gửi yêu cầu
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UserInfor;