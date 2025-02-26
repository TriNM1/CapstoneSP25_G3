import React, { useState } from "react";
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
import FilterPanel from "../../../components/FilterPanel"; // Nếu dùng chung bộ lọc, nếu không có thì bỏ qua
import "./MyToy.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import toy1 from "../../../assets/toy1.jpg";
// Giả sử đây là dữ liệu mẫu ban đầu cho đồ chơi
const initialToys = [
  {
    id: 1,
    image: toy1,
    name: "Xe đua mini",
    postedDate: "2023-07-01",
    borrowCount: 10,
    status: "Còn trống",
    // Các trường bổ sung cho việc chỉnh sửa:
    category: "Xe",
    condition: "new",
    ageGroup: "0-3",
    price: "50,000 VND",
    description: "Mô tả cho xe đua mini",
    size: "20x10x10 cm",
    borrowNotes: "Không mượn quá 3 ngày",
  },
  {
    id: 2,
    image: toy1,
    name: "Robot chơi",
    postedDate: "2023-07-02",
    borrowCount: 5,
    status: "Đã cho mượn",
    category: "Robot",
    condition: "used",
    ageGroup: "4-6",
    price: "70,000 VND",
    description: "Mô tả cho Robot chơi",
    size: "30x20x20 cm",
    borrowNotes: "Kiểm tra trước khi mượn",
  },
  {
    id: 3,
    image: toy1,
    name: "Búp bê Barbie",
    postedDate: "2023-07-03",
    borrowCount: 8,
    status: "Còn trống",
    category: "Búp bê",
    condition: "new",
    ageGroup: "7-9",
    price: "60,000 VND",
    description: "Mô tả cho Búp bê Barbie",
    size: "25x15x10 cm",
    borrowNotes: "",
  },
  {
    id: 4,
    image: toy1,
    name: "Khối xếp hình",
    postedDate: "2023-07-04",
    borrowCount: 3,
    status: "Còn trống",
    category: "Khối xếp hình",
    condition: "new",
    ageGroup: "4-6",
    price: "40,000 VND",
    description: "Mô tả cho Khối xếp hình",
    size: "15x15x15 cm",
    borrowNotes: "",
  },
  {
    id: 5,
    image: toy1,
    name: "Xe điều khiển",
    postedDate: "2023-07-05",
    borrowCount: 12,
    status: "Đã cho mượn",
    category: "Xe",
    condition: "used",
    ageGroup: "10+",
    price: "80,000 VND",
    description: "Mô tả cho Xe điều khiển",
    size: "35x25x20 cm",
    borrowNotes: "",
  },
  {
    id: 6,
    image: toy1,
    name: "Đồ chơi xếp hình",
    postedDate: "2023-07-06",
    borrowCount: 7,
    status: "Còn trống",
    category: "Khối xếp hình",
    condition: "new",
    ageGroup: "0-3",
    price: "30,000 VND",
    description: "Mô tả cho Đồ chơi xếp hình",
    size: "20x20x20 cm",
    borrowNotes: "",
  },
];

const MyToy = () => {
  const [activeLink, setActiveLink] = useState("mytoy");
  const sideMenuItems = [
    { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // Bộ lọc dùng chung (nếu cần sử dụng)
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

  const [toys, setToys] = useState(initialToys);

  // Modal xác nhận cho nút Xóa
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(""); // chỉ dùng cho delete
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
        price: toyToEdit.price,
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

  // Xử lý cập nhật (Update) đồ chơi
  const handleUpdateToy = () => {
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
              price: editToyData.price,
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
  };

  // Xử lý cho nút Xóa (sử dụng modal xác nhận)
  const handleDelete = (id) => {
    setConfirmAction("delete");
    setSelectedToyId(id);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction === "delete") {
      setToys((prev) => prev.filter((toy) => toy.id !== selectedToyId));
      toast.success("Đã xóa đồ chơi thành công!");
    }
    setShowConfirmModal(false);
    setConfirmAction("");
    setSelectedToyId(null);
  };

  // Load thêm item (ví dụ: thêm 3 item nữa)
  const handleLoadMore = () => {
    setToys([...toys, ...initialToys.slice(0, 3)]);
  };

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

            <Row className="toy-items-section">
              {toys.map((toy) => (
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
            <div className="text-center">
              <Button
                variant="outline-primary"
                className="view-more-btn"
                onClick={handleLoadMore}
              >
                Xem thêm
              </Button>
            </div>
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
                  src={toys[0].image}
                  alt="Preview"
                  className="preview-image mt-2"
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
                <option value="xe">Xe</option>
                <option value="robot">Robot</option>
                <option value="bupbe">Búp bê</option>
                <option value="khixep">Khối xếp hình</option>
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
