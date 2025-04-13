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
import "./ManagerPost.scss";

const ManagePost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
              
            </Row>
            {/* Pagination remains unchanged */}
          </Col>
        </Row>
      </Container>
      
    </div>
  );
};

export default ManagePost;