import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Header from "../../../components/Header";
import "./UserGuide.scss";
import Footer from "../../../components/footer";

const UserGuide = () => {
  return (
    <div className="user-guide-page home-page">
      <Header
        activeLink="guide"
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container className="mt-4">
        <Row>
          <Col xs={12}>
            <h1 className="page-title">Hướng dẫn sử dụng website</h1>
            <div className="guide-content">
              <p>
                Chào mừng bạn đến với website của chúng tôi! Dưới đây là một số
                hướng dẫn cơ bản để bạn có thể sử dụng website một cách hiệu
                quả:
              </p>
              <ol>
                <li>
                  <strong>Đăng nhập / Đăng ký:</strong> Truy cập trang đăng nhập
                  hoặc đăng ký để bắt đầu sử dụng các tính năng của website.
                </li>
                <li>
                  <strong>Thêm đồ chơi cho mượn:</strong> Sử dụng chức năng thêm
                  đồ chơi để đăng tải sản phẩm của bạn cho người khác mượn.
                </li>
                <li>
                  <strong>Danh sách đồ chơi của tôi:</strong> Quản lý các sản
                  phẩm đã đăng và theo dõi giao dịch mượn trả.
                </li>
                <li>
                  <strong>Đang cho mượn:</strong> Xem các giao dịch đang diễn ra
                  khi bạn cho mượn đồ chơi cho người khác.
                </li>
                <li>
                  <strong>Lịch sử trao đổi:</strong> Kiểm tra lại các giao dịch
                  đã hoàn tất hoặc bị hủy.
                </li>
              </ol>
              <p>
                Nếu bạn gặp khó khăn hoặc có thắc mắc, hãy liên hệ với bộ phận
                hỗ trợ của chúng tôi qua trang liên hệ hoặc số điện thoại được
                cung cấp trên website.
              </p>
              <p>
                Chúc bạn có trải nghiệm thú vị và hiệu quả khi sử dụng website!
              </p>
            </div>
          </Col>
        </Row>
        <Footer/>
      </Container>
    </div>
  );
};

export default UserGuide;
