import  { useState } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import Header from "../../../components/Header";

// eslint-disable-next-line react/prop-types
const UserDetail = ({ isLoggedIn, setActiveLink }) => {
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP. HCM",
    avatar: "",
  });

  const [editMode, setEditMode] = useState(false);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
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
                  <Form.Label column sm={12} className="text-start">Tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label column sm={12} className="text-start">Email</Form.Label>
                  <Form.Control type="email" name="email" value={user.email} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label column sm={12} className="text-start">Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={user.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label column sm={12} className="text-start">Địa chỉ</Form.Label>
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
                    <Button variant="primary" className="me-2">
                      Lưu
                    </Button>
                    <Button variant="secondary" onClick={() => setEditMode(false)}>
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
      </Container>
    </>
  );
};

export default UserDetail;
