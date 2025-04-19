import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import AdminSideMenu from "../../components/AdminSideMenu";
import "./AdminProfile.scss";
// import avatar from "../../assets/avatar.jpg"; // Đảm bảo có ảnh avatar trong thư mục assets

const AdminProfile = () => {
  const menuItems = [
    { id: 1, label: "Trang chủ", link: "/adminpage" },
    { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
    { id: 3, label: "Quản lý bài đăng", link: "/managepost" },
    { id: 4, label: "Thống kê", link: "/statistic" },
  ];

  return (
    <div className="admin-profile-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Admin Side Menu */}
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} />
          </Col>
          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            <div className="profile-section">
              <h1>Hồ sơ cá nhân của Admin</h1>
              <Row>
                <Col xs={12} md={4}>
                  {/* Ảnh đại diện admin */}
                  {/* <div className="avatar-section">
                    <img
                      src={avatar}
                      alt="Avatar của Admin"
                      className="profile-avatar"
                    />
                  </div> */}
                </Col>
                <Col xs={12} md={10}>
                  {/* Thông tin chi tiết admin */}
                  <div className="profile-info">
                    <Card>
                      <Card.Body>
                        <Card.Title>Thông tin cá nhân</Card.Title>
                        <Card.Text>
                          <p>
                            <strong>Tên:</strong> Admin
                          </p>
                          <p>
                            <strong>Email:</strong> admin@example.com
                          </p>
                          <p>
                            <strong>Số điện thoại:</strong> 0123456789
                          </p>
                          <p>
                            <strong>Vai trò:</strong> Quản trị viên
                          </p>
                        </Card.Text>
                        <Button variant="primary">Chỉnh sửa thông tin</Button>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminProfile;
