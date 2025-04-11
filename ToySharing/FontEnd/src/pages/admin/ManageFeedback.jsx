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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // New states for ban/unban functionality
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [actionType, setActionType] = useState('');

  // Updated mock data with userId
  const feedbacks = [
    {
      id: 1,
      userId: "user1",
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
      userId: "user2",
      userImage: userPlaceholder,
      userName: "Trần Thị C",
      reportDate: "2025-03-02",
      reporterAvatar: userPlaceholder,
      reporterName: "Lê Thị D",
      evidenceImages: [userPlaceholder],
      reason: "",
    },
  ];

  const handleDetailClick = (feedback) => {
    setShowDetailModal(true);
  };

  // Ban/Unban handlers
  const handleBanClick = (userId) => {
    setSelectedUserId(userId);
    setActionType('ban');
    setShowBanModal(true);
  };

  const handleUnBanClick = (userId) => {
    setSelectedUserId(userId);
    setActionType('unban');
    setShowBanModal(true);
  };

  const handleConfirmBan = async () => {
    if (!selectedUserId || !banReason.trim()) {
      alert('Vui lòng nhập đầy đủ lý do');
      return;
    }

    try {
      const url = `https://localhost:7128/api/User/${actionType}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          reason: banReason
        })
      });

      if (response.ok) {
        alert(`Thao tác ${actionType === 'ban' ? 'cấm' : 'gỡ cấm'} thành công!`);
        // Add logic to update user status in UI if needed
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Thao tác thất bại!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối đến server!');
    }

    setShowBanModal(false);
    setBanReason('');
  };

  // Pagination logic
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
          <Col xs={12} md={2}>
            <AdminSideMenu
              menuItems={[
                { id: 1, label: "Trang chủ", link: "/adminpage" },
                { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
                { id: 3, label: "Quản lý vi phạm", link: "/managefeedback" },
                { id: 4, label: "Thống kê", link: "/statistic" },
              ]}
            />
          </Col>

          <Col xs={12} md={10} className="main-content" style={{ width: "63vw" }}>
            <Row className="filter-section mb-4">
              {/* Filter controls remain unchanged */}
            </Row>

            {currentItems.map((feedback) => (
              <Row
                key={feedback.id}
                className="feedback-item mb-3 align-items-center p-3 border rounded"
              >
                {/* Existing columns */}
                <Col md={1}>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleBanClick(feedback.userId)}
                  >
                    Cấm
                  </Button>
                </Col>
                <Col md={1}>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleUnBanClick(feedback.userId)}
                  >
                    Gỡ
                  </Button>
                </Col>
              </Row>
            ))}

            {/* Pagination remains unchanged */}
          </Col>
        </Row>
      </Container>

      {/* Ban/Unban Modal */}
      <Modal show={showBanModal} onHide={() => setShowBanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'ban' ? 'CẤM NGƯỜI DÙNG' : 'GỠ CẤM NGƯỜI DÙNG'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="banReason">
            <Form.Label>Lý do:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={`Nhập lý do ${actionType === 'ban' ? 'cấm' : 'gỡ cấm'}...`}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBanModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmBan}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Existing Detail Modal remains unchanged */}
    </div>
  );
};

export default ManageFeedback;