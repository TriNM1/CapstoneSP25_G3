import { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import Header from "../../../components/Header";
import axios from "axios";
import Footer from "../../../components/footer";
import { useNavigate, useParams } from "react-router-dom";

// eslint-disable-next-line react/prop-types
const UserDetail = ({ isLoggedIn, setActiveLink, Id }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUserId] = useState(
    localStorage.getItem("userId") || sessionStorage.getItem("userId")
  );
  const [editMode, setEditMode] = useState(false);
  // const [selectedFile, setSelectedFile] = useState(null);
  const [user, setUser] = useState({
    name: "",
    displayName: "",
    phone: "",
    address: "",
    // avatar: '',
    // Thêm các trường khác từ API response
    status: 0,
    rating: 0,
    gender: true,
  });

  useEffect(() => {
    if (id !== currentUserId) {
      alert("Bạn không có quyền truy cập!");
      navigate("/home");
    }
  }, [id, currentUserId, navigate]);

  // Thêm interceptor cho axios
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`https://localhost:7128/api/User/${currentUserId}`);
      const apiData = response.data;
      
      setUser({
        name: apiData.name || '',
        displayName: apiData.displayName || '',
        phone: apiData.phone || '', 
        address: apiData.address || '',
        status: apiData.status || 0,
        rating: apiData.rating || 0,
        gender: apiData.gender !== undefined ? apiData.gender : true
      });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    if (currentUserId) fetchUser();
  }, [currentUserId]);

  // Xử lý thay đổi dữ liệu ở input
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  // Hàm xử lý lưu thay đổi thông tin người dùng`1
  const handleSave = async () => {
    try {
      await axios.put("https://localhost:7128/api/User", user);
      setEditMode(false);
      alert("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      alert("Cập nhật thất bại!");
    }
  };

  // const handleFileChange = (e) => {
  //   setSelectedFile(e.target.files[0]);
  // };

  // const handleUpload = async () => {
  //   if (!selectedFile) return;

  //   const formData = new FormData();
  //   formData.append("avatar", selectedFile);

  //   try {
  //     const response = await axios.post(
  //       "https://localhost:7128/api/User/upload-avatar",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     setUser(prev => ({...prev, avatar: response.data.avatarUrl}));
  //     alert("Tải lên ảnh đại diện thành công!");
  //   } catch (error) {
  //     console.error("Lỗi khi tải lên ảnh:", error);
  //     alert("Tải lên thất bại!");
  //   }
  // };
  return (
    <>
      <Header isLoggedIn={true} setActiveLink={setActiveLink} />
      <Container className="mt-4">
        <Card className="p-4 shadow">
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              {/* <img
                src={user.avatar}
                alt="User Avatar"
                className="rounded-circle border"
                width="150"
              /> */}
              {/* <h3 className="mt-3">{user.name}</h3> */}
            </Col>
            <Col md={6}>
              <Form>
              <Form.Group className="mb-3">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={user.name}
                    disabled // Luôn disable
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tên hiển thị</Form.Label>
                  <Form.Control
                    type="text"
                    name="displayName"
                    value={user.displayName}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Điện thoại</Form.Label>
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
                    <div className="d-flex gap-2 mt-4">
                      <Button variant="primary" onClick={handleSave}>
                        Lưu thay đổi
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditMode(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="warning"
                    onClick={() => setEditMode(true)}
                    className="mt-4"
                  >
                    Chỉnh sửa thông tin
                  </Button>
                )}
              </Form>
            </Col>
          </Row>
        </Card>
        <Footer />
      </Container>
    </>
  );
};

export default UserDetail;
