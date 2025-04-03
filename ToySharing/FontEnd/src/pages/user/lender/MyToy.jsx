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
    { id: 1, label: "Đăng Tải Đồ Chơi Mới", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // State quản lý danh sách đồ chơi
  const [toys, setToys] = useState([]);
  const [visibleItems, setVisibleItems] = useState(6); // Hiển thị 6 item ban đầu

  // Bộ lọc dùng chung
  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState({
    color: "",
    condition: "",
    category: "",
    ageRange: "",
    brand: "",
    distance: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    console.log("Filter values:", filterValues);
    // Tích hợp logic lọc nếu cần
  };

  // Modal xác nhận cho nút Xóa
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedToyId, setSelectedToyId] = useState(null);

  // Modal chỉnh sửa (Edit Modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editToyData, setEditToyData] = useState({
    id: null,
    image: "",
    toyName: "",
    category: "",
    condition: "",
    ageGroup: "",
    price: "",
    description: "",
    size: "",
    borrowNotes: "",
  });

  const API_BASE_URL = "https://localhost:7128/api";

  // Lấy danh sách đồ chơi từ API
  useEffect(() => {
    const fetchToys = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Vui lòng đăng nhập để xem danh sách đồ chơi!");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Products/my-toys`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const formattedToys = response.data.map((toy) => ({
          id: toy.productId,
          image: toy.images && toy.images.length > 0 ? toy.images[0].path : "https://via.placeholder.com/200",
          name: toy.name,
          postedDate: new Date(toy.postedDate).toISOString().split("T")[0],
          borrowCount: toy.borrowCount || 0,
          status: toy.available === 0 ? "Còn trống" : "Đã cho mượn",
          category: toy.category,
          condition: toy.condition,
          ageGroup: toy.ageGroup,
          price: `${toy.price.toLocaleString("vi-VN")} VND`,
          description: toy.description,
          size: toy.size,
          borrowNotes: toy.borrowNotes,
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

  // Khi bấm Sửa, mở modal chỉnh sửa và prepopulate form với dữ liệu của toy
  const handleEdit = (id) => {
    const toyToEdit = toys.find((toy) => toy.id === id);
    if (toyToEdit) {
      setEditToyData({
        id: toyToEdit.id,
        image: toyToEdit.image,
        toyName: toyToEdit.name,
        category: toyToEdit.category || "",
        condition: toyToEdit.condition || "",
        ageGroup: toyToEdit.ageGroup || "",
        price: toyToEdit.price.replace(" VND", ""),
        description: toyToEdit.description || "",
        size: toyToEdit.size || "",
        borrowNotes: toyToEdit.borrowNotes || "",
      });
      setShowEditModal(true);
    }
  };

  // Xử lý thay đổi trong form chỉnh sửa
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditToyData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý upload ảnh trong modal chỉnh sửa
  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditToyData((prev) => ({
        ...prev,
        image: URL.createObjectURL(e.target.files[0]),
      }));
    }
  };

  // Xử lý cập nhật (Update) đồ chơi qua API
  const handleUpdateToy = async () => {
    try {
      const token = localStorage.getItem("token");
      const updatedToy = {
        name: editToyData.toyName,
        category: editToyData.category,
        condition: editToyData.condition,
        ageGroup: editToyData.ageGroup,
        price: parseInt(editToyData.price.replace(/[^0-9]/g, "")), // Chuyển giá về số
        description: editToyData.description,
        size: editToyData.size,
        borrowNotes: editToyData.borrowNotes,
        images: [editToyData.image], // Giả sử API chấp nhận danh sách URL ảnh
      };

      await axios.put(`${API_BASE_URL}/Products/${editToyData.id}`, updatedToy, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Cập nhật state toys
      setToys((prevToys) =>
        prevToys.map((toy) =>
          toy.id === editToyData.id
            ? {
                ...toy,
                image: editToyData.image,
                name: editToyData.toyName,
                category: editToyData.category,
                condition: editToyData.condition,
                ageGroup: editToyData.ageGroup,
                price: `${parseInt(editToyData.price.replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} VND`,
                description: editToyData.description,
                size: editToyData.size,
                borrowNotes: editToyData.borrowNotes,
              }
            : toy
        )
      );

      toast.success("Cập nhật đồ chơi thành công!");
      setShowEditModal(false);
      setEditToyData({
        id: null,
        image: "",
        toyName: "",
        category: "",
        condition: "",
        ageGroup: "",
        price: "",
        description: "",
        size: "",
        borrowNotes: "",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật đồ chơi:", error);
      toast.error("Có lỗi xảy ra khi cập nhật đồ chơi!");
    }
  };

  // Xử lý cho nút Xóa (sử dụng modal xác nhận)
  const handleDelete = (id) => {
    setConfirmAction("delete");
    setSelectedToyId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/Products/${selectedToyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setToys((prev) => prev.filter((toy) => toy.id !== selectedToyId));
      toast.success("Đã xóa đồ chơi thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa đồ chơi:", error);
      toast.error("Có lỗi xảy ra khi xóa đồ chơi!");
    } finally {
      setShowConfirmModal(false);
      setConfirmAction("");
      setSelectedToyId(null);
    }
  };

  // Load thêm item
  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
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
          {/* Side Menu */}
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={2} />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* Bộ lọc dùng chung */}
            <FilterPanel
              showFilter={showFilter}
              onToggle={() => setShowFilter(!showFilter)}
              onSubmit={handleFilterSubmit}
              filterValues={filterValues}
              onChange={handleFilterChange}
            />

            {toys.length === 0 ? (
              <div className="text-center mt-5">
                <h5>Không có đồ chơi nào</h5>
              </div>
            ) : (
              <>
                <Row className="toy-items-section">
                  {visibleToys.map((toy) => (
                    <Col key={toy.id} xs={12} md={4} className="mb-4">
                      <Card className="toy-card">
                        <Card.Img
                          variant="top"
                          src={toy.image}
                          className="toy-image"
                        />
                        <Card.Body className="text-center">
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
                                toy.status === "Còn trống"
                                  ? "available"
                                  : "unavailable"
                              }
                            >
                              {toy.status}
                            </span>
                          </Card.Text>
                          <div className="toy-actions">
                            <Button
                              variant="warning"
                              size="lg"
                              onClick={() => handleEdit(toy.id)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="lg"
                              className="ms-2"
                              onClick={() => handleDelete(toy.id)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleToys.length < toys.length && (
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
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal chỉnh sửa (Edit Modal) */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Upload ảnh */}
            <Form.Group controlId="editToyImage" className="mb-3">
              <Form.Label>Upload ảnh</Form.Label>
              <Form.Control type="file" onChange={handleEditImageChange} />
              {editToyData.image && (
                <img
                  src={editToyData.image}
                  alt="Preview"
                  className="preview-image mt-2"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
              )}
            </Form.Group>
            {/* Tên đồ chơi */}
            <Form.Group controlId="editToyName" className="mb-3">
              <Form.Label>Tên đồ chơi</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên đồ chơi"
                name="toyName"
                value={editToyData.toyName}
                onChange={handleEditChange}
              />
            </Form.Group>
            {/* Danh mục */}
            <Form.Group controlId="editCategory" className="mb-3">
              <Form.Label>Danh mục</Form.Label>
              <Form.Control
                as="select"
                name="category"
                value={editToyData.category}
                onChange={handleEditChange}
              >
                <option value="">Chọn danh mục</option>
                <option value="Xe">Xe</option>
                <option value="Robot">Robot</option>
                <option value="Búp bê">Búp bê</option>
                <option value="Khối xếp hình">Khối xếp hình</option>
              </Form.Control>
            </Form.Group>
            {/* Tình trạng */}
            <Form.Group controlId="editCondition" className="mb-3">
              <Form.Label>Tình trạng</Form.Label>
              <Form.Control
                as="select"
                name="condition"
                value={editToyData.condition}
                onChange={handleEditChange}
              >
                <option value="">Chọn tình trạng</option>
                <option value="new">Mới</option>
                <option value="used">Cũ</option>
              </Form.Control>
            </Form.Group>
            {/* Độ tuổi phù hợp */}
            <Form.Group controlId="editAgeGroup" className="mb-3">
              <Form.Label>Độ tuổi phù hợp</Form.Label>
              <Form.Control
                as="select"
                name="ageGroup"
                value={editToyData.ageGroup}
                onChange={handleEditChange}
              >
                <option value="">Chọn độ tuổi</option>
                <option value="0-3">0-3</option>
                <option value="4-6">4-6</option>
                <option value="7-9">7-9</option>
                <option value="10+">10+</option>
              </Form.Control>
            </Form.Group>
            {/* Giá */}
            <Form.Group controlId="editPrice" className="mb-3">
              <Form.Label>Giá</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập giá"
                name="price"
                value={editToyData.price}
                onChange={handleEditChange}
              />
            </Form.Group>
            {/* Mô tả */}
            <Form.Group controlId="editDescription" className="mb-3">
              <Form.Label>Mô tả đồ chơi</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập mô tả"
                name="description"
                value={editToyData.description}
                onChange={handleEditChange}
              />
            </Form.Group>
            {/* Kích cỡ */}
            <Form.Group controlId="editSize" className="mb-3">
              <Form.Label>Kích cỡ</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập kích cỡ"
                name="size"
                value={editToyData.size}
                onChange={handleEditChange}
              />
            </Form.Group>
            {/* Lưu ý khi mượn */}
            <Form.Group controlId="editBorrowNotes" className="mb-3">
              <Form.Label>Lưu ý khi mượn</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lưu ý khi mượn"
                name="borrowNotes"
                value={editToyData.borrowNotes}
                onChange={handleEditChange}
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

      {/* Modal xác nhận cho nút Xóa */}
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
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
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