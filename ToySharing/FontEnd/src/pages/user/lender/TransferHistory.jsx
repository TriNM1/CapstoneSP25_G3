import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./TransferHistory.scss";
import toy1 from "../../../assets/toy1.jpg";
import user from "../../../assets/user.png";
import Footer from "../../../components/footer";

const TransferHistory = () => {
  const [activeLink, setActiveLink] = useState("lending");

  // Danh sách các mục cho side menu dùng chung
  const sideMenuItems = [
    { id: 1, label: "Thêm đồ chơi cho mượn", link: "/addtoy" },
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/lending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  // Sample dữ liệu lịch sử trao đổi
  const transferData = [
    {
      id: 1,
      image: toy1,
      name: "Xe đua mini",
      price: "50,000 VND",
      transferDate: "2023-06-30",
      status: "completed", // hoàn thành
      partnerAvatar: user,
      partnerLink: "/partner/1",
    },
    {
      id: 2,
      image: toy1,
      name: "Robot chơi",
      price: "70,000 VND",
      transferDate: "2023-07-01",
      status: "pending", // chưa xác định
      partnerAvatar: user,
      partnerLink: "/partner/2",
    },
    {
      id: 3,
      image: toy1,
      name: "Búp bê Barbie",
      price: "60,000 VND",
      transferDate: "2023-07-02",
      status: "completed",
      partnerAvatar: user,
      partnerLink: "/partner/3",
    },
    {
      id: 4,
      image: toy1,
      name: "Khối xếp hình",
      price: "40,000 VND",
      transferDate: "2023-07-03",
      status: "pending",
      partnerAvatar: user,
      partnerLink: "/partner/4",
    },
    {
      id: 5,
      image: toy1,
      name: "Xe điều khiển",
      price: "80,000 VND",
      transferDate: "2023-07-04",
      status: "completed",
      partnerAvatar: user,
      partnerLink: "/partner/5",
    },
    {
      id: 6,
      image: toy1,
      name: "Đồ chơi xếp hình",
      price: "30,000 VND",
      transferDate: "2023-07-05",
      status: "completed",
      partnerAvatar: user,
      partnerLink: "/partner/6",
    },
  ];

  // State cho datepicker tìm kiếm theo ngày trao đổi
  const [filterDate, setFilterDate] = useState(null);
  // Hiển thị mặc định 6 item, nút "Xem thêm" load thêm 3 item mỗi lần
  const [visibleItems, setVisibleItems] = useState(6);

  const handleLoadMore = () => {
    setVisibleItems(visibleItems + 3);
  };

  const formattedFilterDate = filterDate
    ? filterDate.toISOString().split("T")[0]
    : "";
  const filteredTransfers = formattedFilterDate
    ? transferData.filter((item) => item.transferDate === formattedFilterDate)
    : transferData;
  const visibleTransfers = filteredTransfers.slice(0, visibleItems);

  return (
    <div className="transfer-history-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container fluid>
        <Row>
          {/* Side Menu dùng chung */}
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={5} />
          </Col>
          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            <div className="date-filter mb-3">
              <Form.Group controlId="filterDate">
                <Form.Label>Chọn ngày trao đổi</Form.Label>
                <DatePicker
                  selected={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input"
                  placeholderText="Chọn ngày"
                />
              </Form.Group>
            </div>
            <Row className="transfer-items-section">
              {visibleTransfers.map((item) => (
                <Col key={item.id} xs={12} lg={6} className="mb-4">
                  <Card className="transfer-card">
                    <Card.Img
                      variant="top"
                      src={item.image}
                      className="toy-image"
                    />
                    <Card.Body>
                      <Card.Title className="toy-name">{item.name}</Card.Title>
                      <Card.Text className="toy-price">{item.price}</Card.Text>
                      <Card.Text className="transfer-date">
                        <strong>Ngày trao đổi:</strong> {item.transferDate}
                      </Card.Text>
                      <Card.Text className="transfer-status">
                        <strong>Trạng thái:</strong>{" "}
                        <span
                          className={
                            item.status === "completed"
                              ? "completed"
                              : "pending"
                          }
                        >
                          {item.status === "completed"
                            ? "Hoàn thành"
                            : "Chưa xác định"}
                        </span>
                      </Card.Text>
                      <div className="partner-info d-flex align-items-center">
                        <img
                          src={item.partnerAvatar}
                          alt="Partner Avatar"
                          className="partner-avatar"
                        />
                        <Link to={item.partnerLink} className="partner-link">
                          Trang cá nhân người mượn
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {visibleTransfers.length < filteredTransfers.length && (
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
          </Col>
        </Row>
        <Footer/>
      </Container>
    </div>
  );
};

export default TransferHistory;
