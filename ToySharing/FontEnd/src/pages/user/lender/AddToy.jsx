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
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [toyName, setToyName] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [condition, setCondition] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [price, setPrice] = useState("");
  const [productValue, setProductValue] = useState("");
  const [description, setDescription] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const API_BASE_URL = "https://localhost:7128/api";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
          toast.error("Vui lòng đăng nhập để đăng tải đồ chơi!");
          navigate("/login");
          return;
        }

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
  }, [navigate]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);

    if (!toyName) {
      toast.error("Tên đồ chơi là bắt buộc!");
      return;
    }
    if (!category) {
      toast.error("Danh mục là bắt buộc!");
      return;
    }
    if (!condition) {
      toast.error("Tình trạng đồ chơi là bắt buộc!");
      return;
    }
    if (!ageGroup) {
      toast.error("Độ tuổi phù hợp là bắt buộc!");
      return;
    }
    // Validation for price
    if (!price) {
      toast.error("Phí cho mượn là bắt buộc!");
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      toast.error("Phí cho mượn phải là một số!");
      return;
    }
    if (priceValue < 0) {
      toast.error("Phí cho mượn không thể là số âm!");
      return;
    }
    if (priceValue > 0 && priceValue < 1000) {
      toast.error("Nếu nhập phí cho mượn lớn hơn 0, nó phải ít nhất là 1000!");
      return;
    }
    if (priceValue > productValue) {
      toast.error("Phí cho mượn không được vượt quá giá trị sản phẩm");
      return;
    }

    // Validation for productValue
    if (!productValue) {
      toast.error("Giá trị đồ chơi là bắt buộc!");
      return;
    }
    const productValueNum = parseFloat(productValue);
    if (isNaN(productValueNum)) {
      toast.error("Giá trị đồ chơi phải là một số!");
      return;
    }
    if (productValueNum < 0) {
      toast.error("Giá trị đồ chơi không thể là số âm!");
      return;
    }
    if (productValueNum > 0 && productValueNum < 1000) {
      toast.error("Nếu nhập giá trị đồ chơi lớn hơn 0, nó phải ít nhất là 1000!");
      return;
    }

    if (productValue < priceValue) {
      toast.error("Giá trị đồ chơi phải lớn hơn phí cho mượn");
      return;
    }
    
    if (!imageFile) {
      toast.error("Vui lòng chọn một ảnh cho đồ chơi!");
      return;
    }

    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("Name", toyName);
      formData.append("CategoryName", category);
      formData.append("ProductStatus", condition === "new" ? "0" : "1");
      formData.append("SuitableAge", parseInt(ageGroup.split("-")[0], 10));
      formData.append("Price", parseFloat(price));
      formData.append("ProductValue", parseFloat(productValue));
      formData.append("Description", description || "");
      formData.append("Files", imageFile);

      console.log("FormData being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axios.post(`${API_BASE_URL}/Products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đăng tải đồ chơi thành công!");
      navigate("/mytoy");
      // Reset form
      setPreviewImage(null);
      setImageFile(null);
      setToyName("");
      setCategory("");
      setCondition("");
      setAgeGroup("");
      setPrice("");
      setProductValue("");
      setDescription("");

      // Chuyển hướng đến trang "Danh sách đồ chơi của tôi"
      navigate("/mytoy");
    } catch (error) {
      console.error("Error creating product:", error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu!";
      console.log("Error response data:", error.response?.data);
      toast.error(errorMessage);
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
                <Form.Label>
                  Upload ảnh <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="preview-image mt-2" />
                )}
              </Form.Group>

              <Form.Group controlId="toyName" className="mb-3">
                <Form.Label>
                  Tên đồ chơi <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên đồ chơi"
                  value={toyName}
                  onChange={(e) => setToyName(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="category" className="mb-3">
                <Form.Label>
                  Danh mục <span className="required-asterisk">*</span>
                </Form.Label>
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
                <Form.Label>
                  Tình trạng đồ chơi <span className="required-asterisk">*</span>
                </Form.Label>
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
                <Form.Label>
                  Độ tuổi phù hợp <span className="required-asterisk">*</span>
                </Form.Label>
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
                <Form.Label>
                  Phí cho mượn <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Nhập phí cho mượn (ví dụ 10000 sẽ là 10.000VND)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="productValue" className="mb-3">
                <Form.Label>
                  Giá trị đồ chơi <span className="required-asterisk">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Nhập giá trị của đồ chơi (ví dụ 10000 sẽ là 10.000VND)"
                  value={productValue}
                  onChange={(e) => setProductValue(e.target.value)}
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

              <Button variant="primary" type="submit" className="submit-btn">
                Đăng đồ chơi
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn gửi yêu cầu này không?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
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