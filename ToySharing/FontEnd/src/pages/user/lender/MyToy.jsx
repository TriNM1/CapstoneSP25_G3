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
import FilterPanel from "../../../components/FilterPanel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyToy.scss";

const MyToy = () => {
  const navigate = useNavigate();
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
    color: "",
    condition: "",
    category: "",
    ageRange: "",
    brand: "",
    distance: "",
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

        const formattedToys = response.data.map((toy) => ({
          id: toy.productId,
          image: toy.imagePaths && toy.imagePaths.length > 0 ? toy.imagePaths[0] : "https://via.placeholder.com/200",
          name: toy.name,
          postedDate: new Date(toy.createdAt).toISOString().split("T")[0],
          borrowCount: toy.borrowCount || 0,
          status: toy.available === 0 ? "Sẵn sàng cho mượn" : "Đã cho mượn",
          categoryName: toy.categoryName,
          productStatus: toy.productStatus === 0 ? "Mới" : toy.productStatus === 1 ? "Cũ" : "Không xác định",
          suitableAge: toy.suitableAge,
          price: `${toy.price.toLocaleString("vi-VN")} VND`,
          description: toy.description,
        }));

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
      setEditToyData({
        id: toyToEdit.id,
        imagePaths: [toyToEdit.image],
        files: [],
        name: toyToEdit.name || "",
        categoryName: toyToEdit.categoryName || "",
        productStatus: toyToEdit.productStatus || "",
        suitableAge: toyToEdit.suitableAge ? String(toyToEdit.suitableAge) : "",
        price: toyToEdit.price ? toyToEdit.price.replace(" VND", "") : "",
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
    const price = parseFloat(editToyData.price.replace(/[^0-9.]/g, ""));
    if (isNaN(price) || price < -1) {
      toast.error("Phí mượn đồ chơi phải là một số không âm!");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để cập nhật đồ chơi!");
        return;
      }

      const productStatusMap = {
        "New": 0,
        "Used": 1,
        "": 0,
      };
      const productStatus = productStatusMap[editToyData.productStatus] || 0;

      const formData = new FormData();
      formData.append("Name", editToyData.name);
      formData.append("CategoryName", editToyData.categoryName || "");
      formData.append("ProductStatus", productStatus);
      formData.append("SuitableAge", suitableAge);
      formData.append("Price", price);
      formData.append("Description", editToyData.description || "");
      formData.append("Available", editToyData.available || 0);

      if (editToyData.files.length > 0) {
        editToyData.files.forEach((file) => formData.append("Files", file));
      }

      const response = await axios.put(`${API_BASE_URL}/Products/${editToyData.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setToys((prevToys) =>
        prevToys.map((toy) =>
          toy.id === editToyData.id
            ? {
                ...toy,
                image: response.data.imagePaths[0] || toy.image,
                name: response.data.name,
                categoryName: response.data.categoryName,
                productStatus: response.data.productStatus,
                suitableAge: response.data.suitableAge,
                price: `${response.data.price.toLocaleString("vi-VN")} VND`,
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
      if (error.response) {
        toast.error(error.response.data.message || "Có lỗi xảy ra khi cập nhật đồ chơi!");
      } else {
        toast.error("Không thể kết nối đến server!");
      }
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
      if (error.response) {
        toast.error(error.response.data.message || "Có lỗi xảy ra khi xóa đồ chơi!");
      } else {
        toast.error("Không thể kết nối đến server!");
      }
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

  const visibleToys = toys.slice(0, visibleItems);

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
                  onSubmit={(e) => e.preventDefault()}
                  filterValues={filterValues}
                  onChange={(e) => setFilterValues({ ...filterValues, [e.target.name]: e.target.value })}
                />
              </div>
              <Button variant="primary" className="add-toy-btn ms-3" onClick={handleAddToy}>
                Đăng đồ chơi mới
              </Button>
            </div>
            {toys.length === 0 ? (
              <div className="text-center mt-5">
                <h5>Không có đồ chơi nào</h5>
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
                        <Card.Img variant="top" src={toy.image} className="toy-image" />
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
                            <span className={toy.status === "Sẵn sàng cho mượn" ? "available" : "unavailable"}>
                              {toy.status}
                            </span>
                          </Card.Text>
                          <div className="card-actions">
                            <Button className="btn-edit" onClick={(e) => handleEdit(e, toy.id)}>
                              Sửa
                            </Button>
                            {toy.status === "Sẵn sàng cho mượn" && (
                              <Button className="btn-delete" onClick={(e) => handleDelete(e, toy.id)}>
                                Xóa
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleToys.length < toys.length && (
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
                    style={{ width: "100px", height: "100px", objectFit: "cover", marginRight: "10px" }}
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
              <Form.Label>Tên đồ chơi <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editToyData.name}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="editCategory" className="mb-3">
              <Form.Label>Danh mục</Form.Label>
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
              <Form.Label>Tình trạng</Form.Label>
              <Form.Control
                as="select"
                name="productStatus"
                value={editToyData.productStatus}
                onChange={handleEditChange}
              >
                <option value="0">Mới</option>
                <option value="1">Cũ</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="editAgeGroup" className="mb-3">
              <Form.Label>Độ tuổi phù hợp <span className="text-danger">*</span></Form.Label>
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
              <Form.Label>Phí mượn đồ chơi <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="price"
                value={editToyData.price}
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
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpdateToy}>
            Update
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
              <img
                src={selectedToy.image}
                alt={selectedToy.name}
                style={{ width: "100%", height: "auto", maxHeight: "200px", objectFit: "cover" }}
              />
              <h5 className="mt-3">{selectedToy.name}</h5>
              <p><strong>Danh mục:</strong> {selectedToy.categoryName || "Không có"}</p>
              <p><strong>Tình trạng:</strong> {selectedToy.productStatus || "Không có"}</p>
              <p><strong>Độ tuổi phù hợp:</strong> {selectedToy.suitableAge}</p>
              <p><strong>Giá:</strong> {selectedToy.price}</p>
              <p><strong>Mô tả:</strong> {selectedToy.description || "Không có"}</p>
              <p><strong>Trạng thái:</strong> {selectedToy.status}</p>
              <p><strong>Lượt mượn:</strong> {selectedToy.borrowCount}</p>
              <p><strong>Ngày đăng:</strong> {selectedToy.postedDate}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc muốn xóa đồ chơi này?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default MyToy;