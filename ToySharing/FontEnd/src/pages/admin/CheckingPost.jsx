import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminSideMenu from "../../components/AdminSideMenu";
import toy1 from "../../assets/toy1.jpg";
import "./CheckingPost.scss";

const CheckingPost = () => {
  // Mảng menu dành cho AdminSideMenu
  const menuItems = [
    { id: 1, label: "Trang chủ", link: "/adminpage" },
    { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
    { id: 3, label: "Duyệt bài đăng", link: "/checkingpost" },
    { id: 4, label: "Quản lý vi phạm", link: "/managefeedback" },
    { id: 5, label: "Thống kê", link: "/statistic" },
  ];

  // Dữ liệu bài đăng mẫu
  const initialPosts = [
    { id: 1, image: toy1, name: "Xe đua mini", price: "50,000 VND" },
    { id: 2, image: toy1, name: "Robot chơi", price: "70,000 VND" },
    { id: 3, image: toy1, name: "Búp bê Barbie", price: "60,000 VND" },
    { id: 4, image: toy1, name: "Khối xếp hình", price: "40,000 VND" },
    { id: 5, image: toy1, name: "Xe điều khiển", price: "80,000 VND" },
    { id: 6, image: toy1, name: "Đồ chơi xếp hình", price: "30,000 VND" },
  ];

  const [posts, setPosts] = useState(initialPosts);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  // State cho modal khóa bài đăng
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  // Xử lý duyệt bài đăng
  const handleApprove = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    toast.success("Duyệt thành công!");
  };

  // Mở modal khóa bài đăng
  const handleOpenBlockModal = (post) => {
    setSelectedPost(post);
    setShowBlockModal(true);
  };

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
    setBlockReason("");
    setSelectedPost(null);
  };

  const handleBlock = () => {
    if (!blockReason.trim()) {
      toast.error("Vui lòng nhập lý do khóa!");
      return;
    }
    if (selectedPost) {
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== selectedPost.id)
      );
      toast.success("Khóa thành công!");
    }
    handleCloseBlockModal();
  };

  // Bộ lọc tìm kiếm (ví dụ chỉ lọc theo tên đồ chơi)
  const filteredPosts = posts.filter((post) =>
    post.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="checking-post-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Side Menu dùng chung */}
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} />
          </Col>
          {/* Nội dung chính */}
          <Col xs={12} md={10} className="main-content">
            {/* Thanh tìm kiếm */}
            <div className="search-bar mb-4">
              <Form>
                <Row className="align-items-center">
                  <Col xs={12} md={4} className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={3} className="mb-2">
                    <Form.Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="Hiện">Hiện</option>
                      <option value="Ẩn">Ẩn</option>
                    </Form.Select>
                  </Col>
                  <Col xs={12} md={3} className="mb-2">
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Chọn ngày"
                      className="form-control"
                    />
                  </Col>
                </Row>
              </Form>
            </div>

            {/* Danh sách bài đăng */}
            <Row>
              {filteredPosts.map((post) => (
                <Col key={post.id} xs={12} md={6} className="mb-4">
                  <Card className="post-card">
                    <Card.Img
                      variant="top"
                      src={post.image}
                      className="post-image"
                    />
                    <Card.Body>
                      <Card.Title className="post-title">
                        {post.name}
                      </Card.Title>
                      <Card.Text className="post-price">{post.price}</Card.Text>
                      <div className="post-actions d-flex justify-content-center">
                        <Button
                          variant="primary"
                          className="me-2"
                          onClick={() => handleApprove(post.id)}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleOpenBlockModal(post)}
                        >
                          Khóa
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Nút phân trang */}
            <div className="pagination-section text-center mt-4">
              <Button variant="outline-primary">Phân trang</Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modal nhập lý do khóa */}
      <Modal show={showBlockModal} onHide={handleCloseBlockModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nhập lý do khóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="blockReason">
              <Form.Label>Lý do:</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Nhập lý do..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseBlockModal}>
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleBlock}>
            Khóa
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CheckingPost;
