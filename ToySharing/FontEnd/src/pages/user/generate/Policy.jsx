import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Header from "../../../components/Header";
import "./Policy.scss";
import Footer from "../../../components/footer";

const Policy = () => {
  const [activeLink, setActiveLink] = useState("policy");

  return (
    <div className="policy-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container className="mt-5">
        <Row>
          <Col xs={12}>
            <h1 className="page-title">Chính Sách Website</h1>
            <div className="policy-content">
              <ol>
                <li>
                  <strong>Trả hàng đúng hẹn:</strong> Tuân thủ trả hàng đúng hẹn. Người dùng cam kết trả hàng đúng theo thời hạn đã thỏa thuận. Nếu không, sẽ có các biện pháp xử lý nhằm đảm bảo tính công bằng và uy tín của cộng đồng.
                </li>
                <li>
                  <strong>Giữ hàng cẩn thận:</strong> Người cho mượn cần bảo quản đồ chơi cẩn thận để tránh hư hỏng. Trong trường hợp không tuân thủ quy định bảo quản, người mượn sẽ phải chịu trách nhiệm bồi thường theo chính sách của website.
                </li>
                <li>
                  <strong>Tuân thủ chính sách bảo mật thông tin:</strong> Website cam kết bảo mật thông tin cá nhân của người dùng. Mọi dữ liệu chỉ được sử dụng để xác thực và kết nối giữa các thành viên. Người dùng cần bảo vệ thông tin cá nhân và không chia sẻ mật khẩu.
                </li>
                <li>
                  <strong>Các quy định chung:</strong> Người dùng cần tuân thủ đầy đủ các quy định của website nhằm tạo nên một cộng đồng an toàn, tin cậy và thân thiện. Mọi hành vi vi phạm sẽ bị xử lý theo quy định nội bộ và pháp luật hiện hành.
                </li>
              </ol>
              <p>
                Nếu bạn gặp khó khăn hoặc có thắc mắc, hãy liên hệ với bộ phận hỗ trợ của chúng tôi qua trang liên hệ hoặc số điện thoại được cung cấp trên website.
              </p>
              <p>
                Chúc bạn có trải nghiệm thú vị và hiệu quả khi sử dụng website!
              </p>
            </div>
          </Col>
        </Row>
        <Footer />
      </Container>
    </div>
  );
};

export default Policy;