import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, Modal } from "react-bootstrap";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./AddToy.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddToy = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("add-toy");

  const sideMenuItems = [
    { id: 1, label: "Đăng Tải Đồ Chơi Mới", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // State cho form
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // Lưu URL ảnh sau khi upload
  const [toyName, setToyName] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]); // Danh sách danh mục từ API
  const [condition, setCondition] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const API_BASE_URL = "https://localhost:7128/api";

  // Lấy danh sách danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Vui lòng đăng nhập để đăng tải đồ chơi!");
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/Products/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCategories(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
        toast.error("Không thể tải danh sách danh mục!");
        setCategories([]);
      }
    };

    fetchCategories();
  }, [navigate]);

  // Xử lý chọn ảnh và xem trước
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Upload ảnh lên server
  const uploadImage = async () => {
    if (!imageFile) {
      toast.error("Vui lòng chọn một ảnh cho đồ chơi!");
      return null;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await axios.post(`${API_BASE_URL}/Products/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      toast.error("Không thể upload ảnh!");
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);

    // Validate form fields
    if (!toyName || !category || !condition || !ageGroup || !price || !description || !size || !borrowNotes) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (!imageFile) {
      toast.error("Vui lòng chọn một ảnh cho đồ chơi!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      // Upload ảnh và lấy URL
      const uploadedImageUrl = await uploadImage();
      if (!uploadedImageUrl) {
        return; // Dừng nếu upload ảnh thất bại
      }

      setImageUrl(uploadedImageUrl);

      // Chuẩn bị dữ liệu sản phẩm
      const productData = {
        name: toyName,
        categoryName: category,
        productStatus: condition === "new" ? "New" : "Used",
        suitableAge: parseInt(ageGroup.split("-")[0]),
        price: parseFloat(price),
        description: `${description}\nKích cỡ: ${size}\nLưu ý khi mượn: ${borrowNotes}`,
        available: 0, // Chờ admin phê duyệt
        imagePaths: [uploadedImageUrl], // Sử dụng URL ảnh đã upload
      };

      const response = await axios.post(`${API_BASE_URL}/Products`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Yêu cầu gửi tới admin thành công!");
      // Reset form
      setPreviewImage(null);
      setImageFile(null);
      setImageUrl(null);
      setToyName("");
      setCategory("");
      setCondition("");
      setAgeGroup("");
      setPrice("");
      setDescription("");
      setSize("");
      setBorrowNotes("");
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.response) {
        toast.error(error.response.data.message || "Có lỗi xảy ra khi gửi yêu cầu!");
      } else {
        toast.error("Không thể kết nối đến server!");
      }
    }
  };

  return (
    <div className="add-toy-page home-page">
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
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>

          <Col xs={12} md={10} className="main-content">
            <h2 className="page-title">Đăng Tải Đồ Chơi Mới</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="toyImage" className="mb-3">
                <Form.Label>Upload ảnh</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="preview-image mt-2"
                  />
                )}
              </Form.Group>

              <Form.Group controlId="toyName" className="mb-3">
                <Form.Label>Tên đồ chơi</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên đồ chơi"
                  value={toyName}
                  onChange={(e) => setToyName(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="category" className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Control
                  as="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="condition" className="mb-3">
                <Form.Label>Tình trạng đồ chơi</Form.Label>
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

              <Form.Group controlId="ageGroup" className="mb-3">
                <Form.Label>Độ tuổi phù hợp</Form.Label>
                <Form.Control
                  as="select"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  <option value="">Chọn độ tuổi</option>
                  <option value="0-3">0-3</option>
                  <option value="4-6">4-6</option>
                  <option value="7-9">7-9</option>
                  <option value="10+">10+</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="price" className="mb-3">
                <Form.Label>Phí cho mượn</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Nhập"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="description" className="mb-3">
                <Form.Label>Mô tả đồ chơi</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Nhập mô tả"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="size" className="mb-3">
                <Form.Label>Kích cỡ</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập kích cỡ"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="borrowNotes" className="mb-3">
                <Form.Label>Lưu ý khi mượn</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Nhập lưu ý khi mượn"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="submit-btn">
                Đăng tải đồ chơi
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn gửi yêu cầu này không?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button variant="primary" onClick={confirmSubmit}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddToy;