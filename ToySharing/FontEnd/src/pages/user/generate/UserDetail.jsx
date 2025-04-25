import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card, Modal } from "react-bootstrap";
import Header from "../../../components/Header";
import axios from "axios";
import Footer from "../../../components/footer";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./UserDetail.scss";

const UserDetail = ({ isLoggedIn, setActiveLink }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUserId] = useState(
    localStorage.getItem("userId") || sessionStorage.getItem("userId")
  );
  const [editMode, setEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpdateLocationModal, setShowUpdateLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({
    ward: "",
    district: "",
    city: "",
  });
  const [user, setUser] = useState({
    name: "",
    displayName: "",
    phone: "",
    address: "",
    avatar: "",
    status: 0,
    rating: 0,
    gender: true,
    age: 0,
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
  });

  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (id !== currentUserId) {
      toast.error("Bạn không có quyền truy cập!");
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

  // Lấy thông tin người dùng
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`https://localhost:7128/api/User/${currentUserId}`);
        const apiData = response.data;
        setUser({
          name: apiData.name || "",
          displayName: apiData.displayName || "",
          phone: apiData.phone || "",
          address: apiData.address || "",
          avatar: apiData.avatar || "",
          status: apiData.status || 0,
          rating: apiData.rating || 0,
          gender: apiData.gender !== undefined ? apiData.gender : true,
          age: apiData.age || 0,
          bankName: apiData.bankName || "",
          bankAccount: apiData.bankAccount || "",
          bankAccountName: apiData.bankAccountName || "",
        });
        if (apiData.address) {
          const parts = apiData.address
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part);
          let ward = "";
          let district = "";
          let city = "";
          if (parts.length >= 3) {
            ward = parts[parts.length - 3];
            district = parts[parts.length - 2];
            city = parts[parts.length - 1];
          } else if (parts.length === 2) {
            district = parts[0];
            city = parts[1];
          } else if (parts.length === 1) {
            city = parts[0];
          }
          setLocationForm({ ward, district, city });
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        toast.error("Lỗi khi lấy thông tin người dùng!");
      }
    };

    if (currentUserId) fetchUser();
  }, [currentUserId]);

  // Xử lý thay đổi dữ liệu ở input
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Xử lý lấy vị trí hiện tại
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị!");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Tọa độ hiện tại:", { latitude, longitude }); // Log tọa độ để kiểm tra

        let address = "";
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1`,
            { headers: { "User-Agent": "ToySharingApp" } }
          );
          console.log("Phản hồi từ Nominatim:", response.data); // Log phản hồi để kiểm tra
          if (response.data && response.data.address) {
            const addr = response.data.address;
            // Xử lý địa chỉ theo định dạng Việt Nam
            const ward = addr.suburb || addr.village || "";
            const district = addr.county || addr.district || "";
            const city = addr.city || addr.state || "";
            address = `${ward ? ward + ", " : ""}${district ? district + ", " : ""}${city}`.replace(/, $/, "");
            if (!address) address = response.data.display_name; // Fallback nếu không trích xuất được
          } else {
            address = response.data.display_name || "Không xác định";
          }
        } catch (error) {
          console.error("Lỗi khi lấy địa chỉ từ Nominatim:", error);
          toast.error("Không thể lấy địa chỉ từ tọa độ!");
          return;
        }

        try {
          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          if (!token) {
            toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
            return;
          }
          await axios.put(
            `https://localhost:7128/api/User/${currentUserId}/location`,
            { address },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setUser((prev) => ({ ...prev, address }));

          // Cập nhật form vị trí
          const parts = address
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part);
          let ward = "";
          let district = "";
          let city = "";
          if (parts.length >= 3) {
            ward = parts[parts.length - 3];
            district = parts[parts.length - 2];
            city = parts[parts.length - 1];
          } else if (parts.length === 2) {
            district = parts[0];
            city = parts[1];
          } else if (parts.length === 1) {
            city = parts[0];
          }
          setLocationForm({ ward, district, city });
          toast.success("Lấy vị trí hiện tại thành công!");
        } catch (error) {
          console.error("Lỗi khi cập nhật vị trí:", error);
          toast.error(error.response?.data.message || "Không thể cập nhật vị trí!");
        }
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí hiện tại:", error);
        toast.error("Không thể lấy vị trí hiện tại. Vui lòng thử lại!");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Tùy chọn để tăng độ chính xác
    );
  };

  // Xử lý cập nhật vị trí qua form
  const handleUpdateLocation = () => {
    setShowUpdateLocationModal(true);
  };

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target;
    setLocationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitLocation = async () => {
    const { ward, district, city } = locationForm;
    if (!ward || !district || !city) {
      toast.error("Vui lòng nhập đầy đủ Phường, Quận và Thành phố!");
      return;
    }
    const fullAddress = `${ward}, ${district}, ${city}`;
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để cập nhật vị trí!");
        setShowUpdateLocationModal(false);
        return;
      }
      await axios.put(
        `https://localhost:7128/api/User/${currentUserId}/location`,
        { address: fullAddress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUser((prev) => ({ ...prev, address: fullAddress }));
      setShowUpdateLocationModal(false);
      toast.success("Cập nhật vị trí thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật vị trí:", error);
      toast.error(error.response?.data.message || "Không thể cập nhật vị trí!");
    }
  };

  // Xử lý lưu thay đổi thông tin người dùng
  const handleSave = async () => {
    if (!user.displayName.trim()) {
      toast.error("Vui lòng nhập tên hiển thị!");
      return;
    }
    if (!user.address.trim()) {
      toast.error("Vui lòng nhập địa chỉ!");
      return;
    }
    if (user.bankAccount && !/^\d+$/.test(user.bankAccount)) {
      toast.error("Số tài khoản ngân hàng chỉ được chứa số!");
      return;
    }

    try {
      await axios.put("https://localhost:7128/api/User", {
        name: user.name,
        displayName: user.displayName,
        phone: user.phone || null,
        address: user.address,
        avatar: user.avatar || null,
        status: user.status,
        rating: user.rating,
        gender: user.gender,
        age: user.age,
        bankName: user.bankName || null,
        bankAccount: user.bankAccount || null,
        bankAccountName: user.bankAccountName || null,
        createdAt: user.createdAt || null,
      });
      setEditMode(false);
      toast.success("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Xử lý upload ảnh đại diện
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn một file trước khi tải lên!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "https://localhost:7128/api/User/upload-avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser((prev) => ({ ...prev, avatar: response.data.avatarUrl }));
      setSelectedFile(null);
      toast.success("Tải lên ảnh đại diện thành công!");
    } catch (error) {
      console.error("Lỗi khi tải lên ảnh:", error);
      toast.error("Tải lên thất bại!");
    }
  };

  return (
    <>
      <Header isLoggedIn={true} setActiveLink={setActiveLink} />
      <Container className="mt-4 user-detail">
        <Card className="p-4 shadow">
          <Row className="justify-content-center">
            <Col md={4} className="text-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="rounded-circle border"
                  width="150"
                />
              ) : (
                <div
                  className="rounded-circle border d-flex align-items-center justify-content-center"
                  style={{ width: "150px", height: "150px", backgroundColor: "#f0f0f0" }}
                >
                  Chưa có ảnh
                </div>
              )}
              <Form.Group className="mt-3">
                <Form.Label>Chọn ảnh đại diện mới</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
                {selectedFile && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="mt-2 rounded-circle"
                    width="100"
                  />
                )}
              </Form.Group>
              <Button onClick={handleUpload} className="mt-2" variant="primary">
                Tải lên ảnh đại diện
              </Button>
            </Col>
            <Col md={6}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control type="text" name="name" value={user.name} disabled />
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
                  <Form.Label>Tuổi</Form.Label>
                  <Form.Control
                    type="number"
                    name="age"
                    value={user.age}
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
                <Form.Group className="mb-3 d-flex align-items-end gap-2">
                  <div className="flex-grow-1">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={user.address}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                  </div>
                  {editMode && (
                    <>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleGetCurrentLocation}
                      >
                        Lấy vị trí hiện tại
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleUpdateLocation}
                      >
                        Cập nhật vị trí
                      </Button>
                    </>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tên ngân hàng</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={user.bankName}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số tài khoản</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount"
                    value={user.bankAccount}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tên tài khoản</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccountName"
                    value={user.bankAccountName}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Form.Group>
                {editMode ? (
                  <div className="d-flex gap-2 mt-4">
                    <Button variant="primary" onClick={handleSave}>
                      Lưu thay đổi
                    </Button>
                    <Button variant="secondary" onClick={() => setEditMode(false)}>
                      Hủy
                    </Button>
                  </div>
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
      <Modal
        show={showUpdateLocationModal}
        onHide={() => setShowUpdateLocationModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật vị trí</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="ward" className="mb-3">
              <Form.Label>
                Phường <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="ward"
                value={locationForm.ward}
                onChange={handleLocationFormChange}
                placeholder="Ví dụ: Văn Quán"
                required
              />
            </Form.Group>
            <Form.Group controlId="district" className="mb-3">
              <Form.Label>
                Quận <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="district"
                value={locationForm.district}
                onChange={handleLocationFormChange}
                placeholder="Ví dụ: Hà Đông"
                required
              />
            </Form.Group>
            <Form.Group controlId="city" className="mb-3">
              <Form.Label>
                Thành phố <span className="required-asterisk">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={locationForm.city}
                onChange={handleLocationFormChange}
                placeholder="Ví dụ: Hà Nội"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="action-btn"
            onClick={() => setShowUpdateLocationModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            className="action-btn"
            onClick={handleSubmitLocation}
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