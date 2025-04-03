import { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import Header from "../../../components/Header";
import axios from "axios";
import Footer from "../../../components/footer";

// eslint-disable-next-line react/prop-types
const UserDetail = ({ isLoggedIn, setActiveLink, Id }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [editMode, setEditMode] = useState(false);

  // Gọi API GET khi component được mount để lấy thông tin người dùng
  useEffect(() => {
    axios
      .get(`https://localhost:7128/api/User/${Id}`)
      .then((response) => {
        const data = response.data;
        setUser({
          name: data.userInfo.name,
          email: data.userInfo.email || "",
          phone: data.userInfo.phone || "",
          address: data.userInfo.address,
          avatar: data.userInfo.avatar,
        });
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      });
  }, [Id]);

  // Xử lý thay đổi dữ liệu ở input
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Hàm xử lý lưu thay đổi thông tin người dùng
  const handleSave = () => {
    axios
      .put("https://localhost:7128/api/User", user)
      .then((response) => {
        console.log("Cập nhật thông tin thành công:", response.data);
        setEditMode(false);
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      });
  };

  return (
    <>
      <Header isLoggedIn={isLoggedIn} setActiveLink={setActiveLink} />
      <Container className="mt-4">
        <Card className="p-4 shadow">
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              <img
                src={user.avatar}
                alt="User Avatar"
                className="rounded-circle border"
                width="150"
              />
              <h3 className="mt-3">{user.name}</h3>
            </Col>
            <Col md={6}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={user.email}
                    disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={user.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={user.address}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                {editMode ? (
                  <>
                    <Button
                      variant="primary"
                      className="me-2"
                      onClick={handleSave}
                    >
                      Lưu
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button variant="warning" onClick={() => setEditMode(true)}>
                    Chỉnh sửa
                  </Button>
                )}
              </Form>
            </Col>
          </Row>
        </Card>
        <Footer/>
      </Container>
    </>
  );
};

export default UserDetail;
