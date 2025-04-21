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
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./MyToy.scss";

const FilterPanel = ({ showFilter, onToggle, filterValues, onChange, categories }) => {
  return (
    <div className={`filter-panel ${showFilter ? "show" : ""}`}>
      <Button variant="outline-primary" onClick={onToggle} className="action-btn">
        {showFilter ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
      </Button>
      {showFilter && (
        <Form className="filter-form mt-3">
          <Form.Group controlId="filterName" className="mb-3">
            <Form.Label>Tên đồ chơi</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={filterValues.name}
              onChange={onChange}
              placeholder="Nhập tên đồ chơi"
            />
          </Form.Group>
          <Form.Group controlId="filterCondition" className="mb-3">
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
          <Form.Group controlId="filterCategory" className="mb-3">
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
          <Form.Group controlId="filterAgeRange" className="mb-3">
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
          <Form.Group controlId="filterPriceSort" className="mb-3">
            <Form.Label>Sắp xếp theo phí cho mượn</Form.Label>
            <Form.Control
              as="select"
              name="priceSort"
              value={filterValues.priceSort}
              onChange={onChange}
            >
              <option value="">Mặc định</option>
              <option value="asc">Từ thấp đến cao</option>
              <option value="desc">Từ cao đến thấp</option>
            </Form.Control>
          </Form.Group>
        </Form>
      )}
    </div>
  );
};

const MyToy = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const newToyId = state?.newToyId;
  const [activeLink, setActiveLink] = useState("mytoy");
  const sideMenuItems = [
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const [toys, setToys] = useState([]);
  const [visibleItems, setVisibleItems] = useState(6);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState({
    name: "",
    condition: "",
    category: "",
    ageRange: "",
    priceSort: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editToyData, setEditToyData] = useState({
    id: null,
    imagePaths: [],
    files: [],
    name: "",
    categoryName: "",
    productStatus: "",
    suitableAge: "",
    price: "",
    productValue: "",
    description: "",
    available: 0,
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);

  const [categories, setCategories] = useState([]);

  const API_BASE_URL = "https://localhost:7128/api";

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  useEffect(() => {
    if (newToyId) {
      const timer = setTimeout(() => {
        navigate("/mytoy", { replace: true, state: {} }); // Clear state
      }, 30000); // 30 seconds
      return () => clearTimeout(timer);
    }
  }, [newToyId, navigate]);

  useEffect(() => {
    const fetchToys = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Vui lòng đăng nhập để xem danh sách đồ chơi!");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Products/my-toys`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedToys = response.data
          .map((toy) => ({
            id: toy.productId,
            image:
              toy.imagePaths && toy.imagePaths.length > 0
                ? toy.imagePaths[0]
                : "https://via.placeholder.com/300x200?text=No+Image",
            name: toy.name || "Không có tên",
            postedDate: new Date(toy.createdAt).toISOString().split("T")[0],
            createdDate: new Date(toy.createdAt), // For sorting
            borrowCount: toy.borrowCount || 0,
            status: toy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
            categoryName: toy.categoryName || "Không có danh mục",
            productStatus: toy.productStatus === 0 ? "Mới" : "Cũ",
            suitableAge: toy.suitableAge || "Không xác định",
            price: parseFloat(toy.price) || 0,
            productValue: `${toy.productValue || 0} VND`,
            description: toy.description || "Không có mô tả",
          }))
          .sort((a, b) => b.createdDate - a.createdDate); // Sort by newest first
        setToys(formattedToys);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đồ chơi:", error);
        toast.error("Không thể tải danh sách đồ chơi từ API!");
        setToys([]);
      }
    };

    fetchToys();
  }, [navigate]);

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
        toast.error("Không thể tải danh sách danh mục!");
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const handleEdit = (e, id) => {
    e.stopPropagation();
    const toyToEdit = toys.find((toy) => toy.id === id);
    if (toyToEdit) {
      const parseCurrency = (value) => {
        if (
          !value ||
          value === "0 VND" ||
          value === "null VND" ||
          value === "undefined VND"
        ) {
          return "";
        }
        return value.replace(" VND", "");
      };

      setEditToyData({
        id: toyToEdit.id,
        imagePaths: [toyToEdit.image],
        files: [],
        name: toyToEdit.name || "",
        categoryName: toyToEdit.categoryName || "",
        productStatus: toyToEdit.productStatus || "",
        suitableAge: toyToEdit.suitableAge ? String(toyToEdit.suitableAge) : "",
        price: toyToEdit.price.toString(),
        productValue: parseCurrency(toyToEdit.productValue),
        description: toyToEdit.description || "",
        available: toyToEdit.status === "Sẵn sàng cho mượn" ? 0 : 1,
      });
      setShowEditModal(true);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditToyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = (e) => {
    if (e.target.files) {
      setEditToyData((prev) => ({
        ...prev,
        files: Array.from(e.target.files),
      }));
    }
  };

  const handleUpdateToy = async () => {
    if (!editToyData.name) {
      toast.error("Tên đồ chơi không được để trống!");
      return;
    }
    const suitableAge = parseInt(editToyData.suitableAge);
    if (isNaN(suitableAge) || suitableAge < 0 || suitableAge > 50) {
      toast.error("Độ tuổi phù hợp phải là số từ 0 đến 50!");
      return;
    }

    const price = parseFloat(editToyData.price);
    const productValue = parseFloat(editToyData.productValue);

    if (isNaN(price) || price === "") {
      toast.error("Phí cho mượn là bắt buộc và phải là một số!");
      return;
    }
    if (price < 0) {
      toast.error("Phí cho mượn không thể là số âm!");
      return;
    }
    if (price > 0 && price < 1000) {
      toast.error("Phí cho mượn phải ít nhất là 1000 nếu lớn hơn 0!");
      return;
    }
    if (price > productValue) {
      toast.error("Phí cho mượn không được vượt quá giá trị đồ chơi!");
      return;
    }

    if (isNaN(productValue) || productValue === "") {
      toast.error("Giá trị đồ chơi là bắt buộc và phải là một số!");
      return;
    }
    if (productValue < 0) {
      toast.error("Giá trị đồ chơi không thể là số âm!");
      return;
    }
    if (productValue > 0 && productValue < 1000) {
      toast.error("Giá trị đồ chơi phải ít nhất là 1000 nếu lớn hơn 0!");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để cập nhật đồ chơi!");
        return;
      }

      const productStatusMap = {
        Mới: 0,
        Cũ: 1,
        "": 0,
      };
      const productStatus = productStatusMap[editToyData.productStatus] || 0;

      const formData = new FormData();
      formData.append("Name", editToyData.name);
      formData.append("CategoryName", editToyData.categoryName || "");
      formData.append("ProductStatus", productStatus);
      formData.append("SuitableAge", suitableAge);
      formData.append("Price", price);
      formData.append("ProductValue", productValue);
      formData.append("Description", editToyData.description || "");
      formData.append("Available", editToyData.available || 0);

      if (editToyData.files.length > 0) {
        editToyData.files.forEach((file) => formData.append("Files", file));
      }

      const response = await axios.put(
        `${API_BASE_URL}/Products/${editToyData.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setToys((prevToys) =>
        prevToys.map((toy) =>
          toy.id === editToyData.id
            ? {
                ...toy,
                image: response.data.imagePaths[0] || toy.image,
                name: response.data.name,
                categoryName: response.data.categoryName,
                productStatus: response.data.productStatus === 0 ? "Mới" : "Cũ",
                suitableAge: response.data.suitableAge,
                price: parseFloat(response.data.price),
                productValue: `${response.data.productValue} VND`,
                description: response.data.description,
                status: response.data.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
              }
            : toy
        )
      );

      toast.success("Cập nhật đồ chơi thành công!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật đồ chơi:", error);
      toast.error(
        error.response?.data.message || "Có lỗi xảy ra khi cập nhật đồ chơi!"
      );
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setConfirmAction("delete");
    setSelectedToyId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xóa đồ chơi!");
        return;
      }

      await axios.delete(`${API_BASE_URL}/Products/${selectedToyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToys((prev) => prev.filter((toy) => toy.id !== selectedToyId));
      toast.success("Đã xóa đồ chơi thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa đồ chơi:", error);
      toast.error(
        error.response?.data.message || "Có lỗi xảy ra khi xóa đồ chơi!"
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction("");
      setSelectedToyId(null);
    }
  };

  const handleViewDetail = (id) => {
    const toy = toys.find((t) => t.id === id);
    setSelectedToy(toy);
    setShowDetailModal(true);
  };

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const handleAddToy = () => {
    navigate("/addtoy");
  };

  const filteredToys = toys
    .filter((toy) => {
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
    })
    .sort((a, b) => {
      if (filterValues.priceSort === "asc") {
        return a.price - b.price;
      } else if (filterValues.priceSort === "desc") {
        return b.price - a.price;
      }
      return b.createdDate - a.createdDate; // Default: newest first
    });

  const visibleToys = filteredToys.slice(0, visibleItems);

  return (
    <div className="mytoy-page home-page">
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
            <SideMenu menuItems={sideMenuItems} activeItem={2} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <div className="d-flex align-items-center mb-3">
              <div className="filter-panel-wrapper flex-grow-1">
                <FilterPanel
                  showFilter={showFilter}
                  onToggle={() => setShowFilter(!showFilter)}
                  filterValues={filterValues}
                  onChange={(e) =>
                    setFilterValues({ ...filterValues, [e.target.name]: e.target.value })
                  }
                  categories={categories}
                />
              </div>
              <Button
                variant="success"
                className="add-toy-btn ms-3 action-btn"
                onClick={handleAddToy}
              >
                Đăng đồ chơi mới
              </Button>
            </div>
            {toys.length === 0 ? (
              <div className="text-center mt-5">
                <p className="no-results">Bạn chưa đăng đồ chơi nào.</p>
              </div>
            ) : filteredToys.length === 0 ? (
              <div className="text-center mt-5">
                <p className="no-results">Không có đồ chơi nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <>
                <Row className="toy-items-section">
                  {visibleToys.map((toy) => (
                    <Col key={toy.id} xs={12} md={6} className="mb-4">
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
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                          {newToyId === toy.id && <span className="new-badge">Mới đăng</span>}
                        </div>
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{toy.name}</Card.Title>
                          <Card.Text className="posted-date">
                            <strong>Ngày đăng:</strong> {toy.postedDate}
                          </Card.Text>
                          <Card.Text className="borrow-count">
                            <strong>Lượt mượn:</strong> {toy.borrowCount}
                          </Card.Text>
                          <Card.Text className="toy-status">
                            <strong>Trạng thái:</strong>{" "}
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
                          <Card.Text className="toy-price">
                            <strong>Phí cho mượn:</strong>{" "}
                            {toy.price.toLocaleString("vi-VN")} VND
                          </Card.Text>
                          <div className="card-actions">
                            <Button
                              variant="primary"
                              className="action-btn btn-edit"
                              onClick={(e) => handleEdit(e, toy.id)}
                            >
                              Sửa
                            </Button>
                            {toy.status === "Sẵn sàng cho mượn" && (
                              <Button
                                variant="danger"
                                className="action-btn btn-delete"
                                onClick={(e) => handleDelete(e, toy.id)}
                              >
                                Xóa
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleToys.length < filteredToys.length && (
                  <div className="text-center">
                    <Button
                      variant="outline-primary"
                      className="view-more-btn action-btn"
                      onClick={handleLoadMore}
                    >
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="editToyOldImages" className="mb-3">
              <Form.Label>Ảnh hiện tại</Form.Label>
              {editToyData.imagePaths.length > 0 ? (
                editToyData.imagePaths.map((path, index) => (
                  <img
                    key={index}
                    src={path}
                    alt={`Old image ${index}`}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      marginRight: "10px",
                    }}
                  />
                ))
              ) : (
                <p>Chưa có ảnh</p>
              )}
            </Form.Group>
            <Form.Group controlId="editToyImage" className="mb-3">
              <Form.Label>Upload ảnh mới (nếu muốn thay đổi)</Form.Label>
              <Form.Control type="file" multiple onChange={handleEditImageChange} />
            </Form.Group>
            <Form.Group controlId="editToyName" className="mb-3">
              <Form.Label>
                Tên đồ chơi <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editToyData.name}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="editCategory" className="mb-3">
              <Form.Label>
                Danh mục <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                as="select"
                name="categoryName"
                value={editToyData.categoryName}
                onChange={handleEditChange}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="editCondition" className="mb-3">
              <Form.Label>
                Tình trạng <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                as="select"
                name="productStatus"
                value={editToyData.productStatus}
                onChange={handleEditChange}
              >
                <option value="">Chọn tình trạng</option>
                <option value="Mới">Mới</option>
                <option value="Cũ">Cũ</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="editAgeGroup" className="mb-3">
              <Form.Label>
                Độ tuổi phù hợp <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="suitableAge"
                value={editToyData.suitableAge}
                onChange={handleEditChange}
                min="0"
                max="50"
                required
              />
            </Form.Group>
            <Form.Group controlId="editPrice" className="mb-3">
              <Form.Label>
                Phí mượn đồ chơi <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={editToyData.price}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="editProductValue" className="mb-3">
              <Form.Label>
                Giá trị đồ chơi <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="productValue"
                value={editToyData.productValue}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="editDescription" className="mb-3">
              <Form.Label>Mô tả đồ chơi</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={editToyData.description}
                onChange={handleEditChange}
                maxLength="500"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="action-btn" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" className="action-btn" onClick={handleUpdateToy}>
            Cập nhật
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
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                  }
                />
                {newToyId === selectedToy.id && <span className="new-badge">Mới đăng</span>}
              </div>
              <h5 className="mt-3">{selectedToy.name}</h5>
              <p>
                <strong>Danh mục:</strong> {selectedToy.categoryName || "Không có"}
              </p>
              <p>
                <strong>Tình trạng:</strong> {selectedToy.productStatus || "Không có"}
              </p>
              <p>
                <strong>Độ tuổi phù hợp:</strong> {selectedToy.suitableAge}
              </p>
              <p>
                <strong>Phí cho mượn:</strong>{" "}
                {selectedToy.price.toLocaleString("vi-VN")} VND
              </p>
              <p>
                <strong>Mô tả:</strong> {selectedToy.description || "Không có"}
              </p>
              <p>
                <strong>Trạng thái:</strong> {selectedToy.status}
              </p>
              <p>
                <strong>Lượt mượn:</strong> {selectedToy.borrowCount}
              </p>
              <p>
                <strong>Ngày đăng:</strong> {selectedToy.postedDate}
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="action-btn" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc muốn xóa đồ chơi này?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" className="action-btn" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" className="action-btn" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default MyToy;