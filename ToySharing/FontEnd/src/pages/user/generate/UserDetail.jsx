import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card, Modal } from "react-bootstrap";
import Header from "../../../components/Header";
import Footer from "../../../components/footer";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./UserDetail.scss";

const UserDetail = ({ isLoggedIn, setActiveLink }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUserId] = useState(localStorage.getItem("userId") || sessionStorage.getItem("userId"));
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpdateLocationModal, setShowUpdateLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({
    street: "",
    ward: "",
    district: "",
    city: "",
    postalCode: "",
  });
  const [user, setUser] = useState({
    name: "", displayName: "", phone: "", address: "", avatar: "", status: 0, rating: 0,
    gender: true, age: 0, bankName: "", bankAccount: "", bankAccountName: "",
  });

  useEffect(() => {
    if (id !== currentUserId) {
      toast.error("Bạn không có quyền truy cập!");
      navigate("/home");
    }
  }, [id, currentUserId, navigate]);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`https://localhost:7128/api/User/${currentUserId}`);
        const apiData = response.data;
        setUser({
          name: apiData.name || "", displayName: apiData.displayName || "", phone: apiData.phone || "",
          address: apiData.address || "", avatar: apiData.avatar || "", status: apiData.status || 0,
          rating: apiData.rating || 0, gender: apiData.gender ?? true, age: apiData.age || 0,
          bankName: apiData.bankName || "", bankAccount: apiData.bankAccount || "",
          bankAccountName: apiData.bankAccountName || "",
        });
        if (apiData.address) {
          const parts = apiData.address.split(",").map(part => part.trim()).filter(part => part);
          let street = "", ward = "", district = "", city = "", postalCode = "";
          
          // Logic phân tích địa chỉ
          const reversedParts = parts.slice().reverse();
          // Postal code: Thường là số, trước "Vietnam" hoặc cuối
          postalCode = reversedParts.find(part => /^\d+$/.test(part)) || "";
          // City: Chứa "Hà Nội" hoặc phần tử thứ 2 từ cuối (trước postal code hoặc Vietnam)
          city = reversedParts.find(part => part.includes("Hà Nội")) || reversedParts[postalCode ? 2 : 1] || reversedParts[0] || "";
          // District: Chứa "District", "Quận", "Huyện"
          district = reversedParts.find(part => /District|Quận|Huyện/i.test(part)) || reversedParts[postalCode ? 3 : 2] || "";
          // Ward: Chứa "Phường", "Xã"
          ward = reversedParts.find(part => /Phường|Xã/i.test(part)) || reversedParts[postalCode ? 4 : 3] || "";
          // Street: Phần còn lại, thường ở đầu
          street = parts.slice(0, parts.length - (postalCode ? 4 : 3)).join(", ") || "";
          
          setLocationForm({ street, ward, district, city, postalCode });
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        toast.error("Lỗi khi lấy thông tin người dùng!");
      }
    };
    if (currentUserId) fetchUser();
  }, [currentUserId]);

  const handleChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị!");
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`,
            { headers: { "User-Agent": "ToySharingApp" } }
          );
          const address = response.data.display_name || "";
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          if (!token) return toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
          await axios.put(
            `https://localhost:7128/api/User/${currentUserId}/location`,
            { address },
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
          setUser(prev => ({ ...prev, address }));
          const parts = address.split(",").map(part => part.trim()).filter(part => part);
          let street = "", ward = "", district = "", city = "", postalCode = "";
          
          // Logic tương tự để lấy các thành phần
          const reversedParts = parts.slice().reverse();
          postalCode = reversedParts.find(part => /^\d+$/.test(part)) || "";
          city = reversedParts.find(part => part.includes("Hà Nội")) || reversedParts[postalCode ? 2 : 1] || reversedParts[0] || "";
          district = reversedParts.find(part => /District|Quận|Huyện/i.test(part)) || reversedParts[postalCode ? 3 : 2] || "";
          ward = reversedParts.find(part => /Phường|Xã/i.test(part)) || reversedParts[postalCode ? 4 : 3] || "";
          street = parts.slice(0, parts.length - (postalCode ? 4 : 3)).join(", ") || "";
          
          setLocationForm({ street, ward, district, city, postalCode });
          toast.success("Lấy vị trí thành công!");
        } catch (error) {
          console.error("Lỗi khi cập nhật vị trí:", error);
          toast.error("Không thể cập nhật vị trí!");
        }
      },
      error => {
        console.error("Lỗi khi lấy vị trí:", error);
        toast.error("Không thể lấy vị trí hiện tại!");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUpdateLocation = () => setShowUpdateLocationModal(true);

  const handleLocationFormChange = e => setLocationForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmitLocation = async () => {
    const { street, ward, district, city, postalCode } = locationForm;
    if (!ward || !district || !city) return toast.error("Vui lòng nhập đầy đủ Phường, Quận, Thành phố!");
    // Ghép địa chỉ: street (nếu có), ward, district, city, postalCode (nếu có)
    const addressParts = [street, ward, district, city, postalCode].filter(part => part.trim());
    const fullAddress = addressParts.join(", ");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
        setShowUpdateLocationModal(false);
        return;
      }
      await axios.put(
        `https://localhost:7128/api/User/${currentUserId}/location`,
        { address: fullAddress },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setUser(prev => ({ ...prev, address: fullAddress }));
      setShowUpdateLocationModal(false);
      toast.success("Cập nhật vị trí thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật vị trí:", error);
      toast.error("Không thể cập nhật vị trí!");
    }
  };

  const handleSave = async () => {
    if (!user.displayName.trim()) return toast.error("Vui lòng nhập tên hiển thị!");
    if (!user.address.trim()) return toast.error("Vui lòng nhập địa chỉ!");
    if (user.bankAccount && !/^\d+$/.test(user.bankAccount)) return toast.error("Số tài khoản chỉ chứa số!");
    try {
      await axios.put("https://localhost:7128/api/User", {
        ...user,
        phone: user.phone || null,
        avatar: user.avatar || null,
        bankName: user.bankName || null,
        bankAccount: user.bankAccount || null,
        bankAccountName: user.bankAccountName || null,
      });
      toast.success("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  const handleFileChange = e => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("Vui lòng chọn file!");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await axios.post("https://localhost:7128/api/User/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(prev => ({ ...prev, avatar: response.data.avatarUrl }));
      setSelectedFile(null);
      toast.success("Tải ảnh thành công!");
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      toast.error("Tải ảnh thất bại!");
    }
  };

  return (
    <>
      <Header isLoggedIn={true} setActiveLink={setActiveLink} />
      <Container className="mt-4 user-detail">
        <Card className="p-4 shadow">
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              <img
                src={user.avatar || "https://via.placeholder.com/100"}
                alt="Avatar"
                className="rounded-circle border mb-2"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              <Form.Group className="mb-2">
                <Form.Label>Chọn ảnh đại diện</Form.Label>
                <Form.Control
                  type="file"
                  size="sm"
                  onChange={handleFileChange}
                  className="custom-file-input"
                />
              </Form.Group>
              <Button
                onClick={handleUpload}
                variant="primary"
                size="sm"
                className="btn-custom w-100"
              >
                Tải ảnh
              </Button>
            </Col>
            <Col md={6}>
              <Form className="compact-form">
                <Form.Group className="mb-2">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={user.name}
                    disabled
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Tên hiển thị</Form.Label>
                  <Form.Control
                    type="text"
                    name="displayName"
                    value={user.displayName}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Tuổi</Form.Label>
                  <Form.Control
                    type="number"
                    name="age"
                    value={user.age}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={user.phone}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Địa chỉ</Form.Label>
                  <div className="d-flex gap-2 align-items-end">
                    <Form.Control
                      type="text"
                      name="address"
                      value={user.address}
                      disabled
                      size="sm"
                      className="flex-grow-1"
                    />
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleGetCurrentLocation}
                      className="btn-custom"
                    >
                      Lấy vị trí
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleUpdateLocation}
                      className="btn-custom"
                    >
                      Cập nhật
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Tên ngân hàng</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={user.bankName}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Số tài khoản</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount"
                    value={user.bankAccount}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Tên tài khoản</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccountName"
                    value={user.bankAccountName}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
                <div className="d-flex justify-content-end mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    className="btn-custom"
                  >
                    Lưu
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Card>
        <Footer />
      </Container>
      <Modal show={showUpdateLocationModal} onHide={() => setShowUpdateLocationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật vị trí</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Đường/Phố</Form.Label>
              <Form.Control
                type="text"
                name="street"
                value={locationForm.street}
                onChange={handleLocationFormChange}
                size="sm"
                placeholder="Ví dụ: Cat Linh Street"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phường/Xã *</Form.Label>
              <Form.Control
                type="text"
                name="ward"
                value={locationForm.ward}
                onChange={handleLocationFormChange}
                size="sm"
                placeholder="Ví dụ: Văn Miếu – Quốc Tử Giám"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Quận/Huyện *</Form.Label>
              <Form.Control
                type="text"
                name="district"
                value={locationForm.district}
                onChange={handleLocationFormChange}
                size="sm"
                placeholder="Ví dụ: Đống Đa"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Thành phố *</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={locationForm.city}
                onChange={handleLocationFormChange}
                size="sm"
                placeholder="Ví dụ: Hà Nội"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Mã bưu điện</Form.Label>
              <Form.Control
                type="text"
                name="postalCode"
                value={locationForm.postalCode}
                onChange={handleLocationFormChange}
                size="sm"
                placeholder="Ví dụ: 10081"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowUpdateLocationModal(false)}
            className="btn-custom"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitLocation}
            className="btn-custom"
          >
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default UserDetail;