import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import AdminSideMenu from "../../components/AdminSideMenu";
import "./AdminPage.scss";
import banner from "../../assets/banner2.jpg";

const AdminPage = () => {
  const menuItems = [
    { id: 1, label: "Trang chủ", link: "/adminpage" },
    { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
    { id: 3, label: "Quản lý bài đăng", link: "/managepost" },
    // { id: 4, label: "Thống kê", link: "/statistic" },
  ];

  return (
    <div className="admin-page home-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Admin Side Menu */}
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} />
          </Col>
          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* Banner */}
            <div className="banner-section">
              <img src={banner} alt="Admin Banner" className="banner-image" />
            </div>
            {/* Nội dung hướng dẫn sử dụng website quản lý */}
            <div className="guide-content">
              <h1>Hướng dẫn sử dụng website quản lý</h1>
              <p>
                Chào mừng bạn đến với hệ thống quản lý của chúng tôi. Tại đây,
                bạn có thể:
              </p>
              <ol>
                <li>
                  <strong>Trang chủ:</strong> Xem tổng quan và các chỉ số hoạt
                  động.
                </li>
                <li>
                  <strong>Quản lý người dùng:</strong> Xem, chỉnh sửa và xóa
                  thông tin người dùng.
                </li>
                <li>
                  <strong>Quản lý bài đăng:</strong> Xem và xử lý các bài đăng của người dùng.
                </li>
                {/* <li>
                  <strong>Thống kê:</strong> Xem báo cáo và phân tích dữ liệu
                  hoạt động.
                </li> */}
              </ol>
              <p>
                Sử dụng các công cụ trên để duy trì hệ thống hoạt động hiệu quả.
                Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminPage;
