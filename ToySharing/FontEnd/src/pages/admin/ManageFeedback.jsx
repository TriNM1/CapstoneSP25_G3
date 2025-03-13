import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Pagination,
  Modal,
  Image,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaFlag } from "react-icons/fa";
import AdminSideMenu from "../../components/AdminSideMenu";
import userPlaceholder from "../../assets/user.png";
import "./ManagerFeedback.scss";

const ManageFeedback = () => {
  // Các state dùng cho thanh tìm kiếm, datepicker, combobox và modal chi tiết báo cáo
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dữ liệu giả cho danh sách báo cáo
  const feedbacks = [
    {
      id: 1,
      userImage: userPlaceholder,
      userName: "Nguyễn Văn A",
      reportDate: "2025-03-01",
      reporterAvatar: userPlaceholder,
      reporterName: "Trần Thị B",
      evidenceImages: [userPlaceholder, userPlaceholder],
      reason: "",
    },
    {
      id: 2,
      userImage: userPlaceholder,
      userName: "Trần Thị C",
      reportDate: "2025-03-02",
      reporterAvatar: userPlaceholder,
      reporterName: "Lê Thị D",
      evidenceImages: [userPlaceholder],
      reason: "",
    },
    // Thêm các item khác tương tự
  ];

  // Hàm mở modal chi tiết báo cáo
  const handleDetailClick = (feedback) => {
    setShowDetailModal(true);
  };

  // Hàm xử lý khi bấm nút xác nhận trong modal
  const handleConfirm = () => {
    setShowDetailModal(false);
  };

  // Phân trang: giả sử 10 item mỗi trang
  const itemsPerPage = 10;
  const totalPages = Math.ceil(feedbacks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = feedbacks.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="manage-feedback admin-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Side menu dùng chung */}
          <Col xs={12} md={2}>
            <AdminSideMenu
              menuItems={[
                { id: 1, label: "Trang chủ", link: "/adminpage" },
                { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
                { id: 3, label: "Duyệt bài đăng", link: "/checkingpost" },
                { id: 4, label: "Quản lý vi phạm", link: "/managefeedback" },
                { id: 5, label: "Thống kê", link: "/statistic" },
              ]}
            />
          </Col>
          {/* Nội dung chính */}
          <Col
            xs={12}
            md={10}
            className="main-content"
            style={{ width: "63vw" }}
          >
            {/* Thanh tìm kiếm và bộ lọc */}
            <Row className="filter-section mb-4">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  placeholderText="Chọn ngày"
                  className="form-control"
                />
              </Col>
              <Col md={4}>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="processed">Đã xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="cancelled">Đã hủy</option>
                </Form.Select>
              </Col>
            </Row>

            {/* Danh sách báo cáo */}
            {currentItems.map((feedback) => (
              <Row
                key={feedback.id}
                className="feedback-item mb-3 align-items-center p-3 border rounded"
              >
                <Col md={1}>
                  <Image
                    src={feedback.userImage}
                    roundedCircle
                    width={50}
                    height={50}
                  />
                </Col>
                <Col md={3}>
                  <div>{feedback.userName}</div>
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    Ngày báo cáo: {feedback.reportDate}
                  </div>
                </Col>
                <Col md={3}>
                  <Link
                    to={`/userprofile/${feedback.id}`}
                    className="btn btn-link p-0"
                  >
                    Xem trang cá nhân
                  </Link>
                </Col>
                <Col md={3}>
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleDetailClick(feedback)}
                  >
                    Chi tiết báo cáo
                  </Button>
                </Col>
              </Row>
            ))}

            {/* Thanh phân trang */}
            <div className="pagination-container text-center">
              <Pagination>
                <Pagination.First
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={currentPage === i + 1}
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    currentPage < totalPages && paginate(currentPage + 1)
                  }
                />
                <Pagination.Last
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modal chi tiết báo cáo */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Phần thông tin người báo cáo */}
          <Row className="mb-3 align-items-center">
            <Col md={1}>
              <Image
                src={userPlaceholder}
                roundedCircle
                width={40}
                height={40}
              />
            </Col>
            <Col md={11}>
              <strong>Người báo cáo:</strong> Trần Thị B
            </Col>
          </Row>

          {/* Phần hiển thị ảnh bằng chứng */}
          <Row className="mb-3">
            <Col>
              <strong>Bằng chứng:</strong>
            </Col>
          </Row>
          <Row className="mb-3">
            {/** Có thể lặp qua mảng feedback.evidenceImages nếu có nhiều ảnh */}
            <Col md={4}>
              <Image src={userPlaceholder} thumbnail />
            </Col>
            <Col md={4}>
              <Image src={userPlaceholder} thumbnail />
            </Col>
          </Row>

          {/* Textarea nhập lý do */}
          <Row className="mb-3">
            <Col>
              <Form.Group controlId="reasonTextarea">
                <Form.Label>Lý do:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Không trả đồ, gọi không nghe"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Nút nhắn tin */}
          <Row className="mb-3">
            <Col className="d-flex gap-2">
              <Button variant="secondary" size="sm">
                Nhắn tin cho người báo cáo
              </Button>
              <Button variant="secondary" size="sm">
                Nhắn tin cho người bị cáo
              </Button>
            </Col>
          </Row>

          {/* Icon cờ chọn trạng thái */}
          <Row className="mb-3">
            <Col className="d-flex gap-3">
              <FaFlag
                size={24}
                style={{
                  cursor: "pointer",
                  color: selectedFlag === "blue" ? "blue" : "grey",
                }}
                onClick={() => setSelectedFlag("blue")}
              />
              <FaFlag
                size={24}
                style={{
                  cursor: "pointer",
                  color: selectedFlag === "red" ? "red" : "grey",
                }}
                onClick={() => setSelectedFlag("red")}
              />
              <FaFlag
                size={24}
                style={{
                  cursor: "pointer",
                  color: selectedFlag === "yellow" ? "gold" : "grey",
                }}
                onClick={() => setSelectedFlag("yellow")}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageFeedback;
