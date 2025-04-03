import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Header from "../../../components/Header";
import "./Policy.scss";
import illustration from "../../../assets/toy1.jpg"; // Ảnh minh họa, thay đổi theo nhu cầu
import Footer from "../../../components/footer";

const Policy = ({
  activeLink,
  setActiveLink,
  isLoggedIn,
  unreadMessages,
  notificationCount,
}) => {
  return (
    <div className="policy-page">
      {/* Header dùng chung */}
      <Header
        activeLink="policy"
        setActiveLink={setActiveLink}
        isLoggedIn={isLoggedIn}
        unreadMessages={unreadMessages}
        notificationCount={notificationCount}
      />
      <Container className="policy-content">
        <h1>Chính Sách Website</h1>

        <Row className="policy-section">
          <Col md={6} className="policy-image">
            <img src={illustration} alt="Minh họa trả hàng đúng hẹn" />
          </Col>
          <Col md={6} className="policy-text">
            <h2>Tuân thủ trả hàng đúng hẹn</h2>
            <p>
              Người dùng cam kết trả hàng đúng theo thời hạn đã thỏa thuận. Nếu
              không, sẽ có các biện pháp xử lý nhằm đảm bảo tính công bằng và uy
              tín của cộng đồng.
            </p>
          </Col>
        </Row>

        <Row className="policy-section">
          <Col md={6} className="policy-image">
            <img src={illustration} alt="Minh họa giữ hàng cẩn thận" />
          </Col>
          <Col md={6} className="policy-text">
            <h2>Tuân thủ giữ hàng cần thận</h2>
            <p>
              Người cho mượn cần bảo quản đồ chơi cẩn thận để tránh hư hỏng.
              Trong trường hợp không tuân thủ quy định bảo quản, người mượn sẽ
              phải chịu trách nhiệm bồi thường theo chính sách của website.
            </p>
          </Col>
        </Row>

        <Row className="policy-section">
          <Col md={6} className="policy-image">
            <img src={illustration} alt="Minh họa bảo mật thông tin" />
          </Col>
          <Col md={6} className="policy-text">
            <h2>Tuân thủ chính sách bảo mật thông tin</h2>
            <p>
              Website cam kết bảo mật thông tin cá nhân của người dùng. Mọi dữ
              liệu chỉ được sử dụng để xác thực và kết nối giữa các thành viên.
              Người dùng cần bảo vệ thông tin cá nhân và không chia sẻ mật khẩu.
            </p>
          </Col>
        </Row>

        <Row className="policy-section">
          <Col md={6} className="policy-image">
            <img src={illustration} alt="Minh họa quy định chung" />
          </Col>
          <Col md={6} className="policy-text">
            <h2>Các quy định chung</h2>
            <p>
              Người dùng cần tuân thủ đầy đủ các quy định của website nhằm tạo
              nên một cộng đồng an toàn, tin cậy và thân thiện. Mọi hành vi vi
              phạm sẽ bị xử lý theo quy định nội bộ và pháp luật hiện hành.
            </p>
          </Col>
        </Row>

        <div className="view-more-section">
          <Button variant="outline-primary" className="view-more-btn">
            Xem thêm
          </Button>
        </div>
        <Footer/>
      </Container>
    </div>
  );
};

export default Policy;
