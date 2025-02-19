import React, { useState } from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./AddToy.scss";

const AddToy = () => {
  // State cho header active link
  const [activeLink, setActiveLink] = useState("add-toy");

  // Các link cho SideMenu
  const sideMenuItems = [
    { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequest" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // State cho form
  const [previewImage, setPreviewImage] = useState(null);
  const [toyName, setToyName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");

  // Xử lý chọn ảnh và xem trước
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ở đây bạn có thể tích hợp logic gửi yêu cầu tới admin (gọi API, vv)
    alert("Yêu cầu gửi tới admin thành công!");
  };

  return (
    <div className="add-toy-page home-page">
      {/* Header dùng chung */}
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />

      <Container className="mt-4">
        <Row>
          {/* Side Menu */}
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={1} />
          </Col>

          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            <h2 className="page-title">Thêm Đồ Chơi Cho Mượn</h2>
            <Form onSubmit={handleSubmit}>
              {/* Upload ảnh */}
              <Form.Group controlId="toyImage" className="mb-3">
                <Form.Label>Upload ảnh</Form.Label>
                <Form.Control type="file" onChange={handleImageChange} />
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="preview-image mt-2"
                  />
                )}
              </Form.Group>

              {/* Tên đồ chơi */}
              <Form.Group controlId="toyName" className="mb-3">
                <Form.Label>Tên đồ chơi</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên đồ chơi"
                  value={toyName}
                  onChange={(e) => setToyName(e.target.value)}
                />
              </Form.Group>

              {/* Danh mục */}
              <Form.Group controlId="category" className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Control
                  as="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  <option value="xe">Xe</option>
                  <option value="robot">Robot</option>
                  <option value="bupbe">Búp bê</option>
                  <option value="khixep">Khối xếp hình</option>
                </Form.Control>
              </Form.Group>

              {/* Tình trạng đồ chơi */}
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

              {/* Độ tuổi phù hợp */}
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

              {/* Giá */}
              <Form.Group controlId="price" className="mb-3">
                <Form.Label>Giá</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập giá"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Form.Group>

              {/* Mô tả đồ chơi */}
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

              {/* Kích cỡ */}
              <Form.Group controlId="size" className="mb-3">
                <Form.Label>Kích cỡ</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập kích cỡ"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </Form.Group>

              {/* Lưu ý khi mượn */}
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
                Gửi yêu cầu tới admin
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddToy;
