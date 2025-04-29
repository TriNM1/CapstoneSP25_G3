import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Pagination,
  Modal,
} from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import { FaLock, FaUnlock, FaInfoCircle } from "react-icons/fa";
import AdminSideMenu from "../../components/AdminSideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ManageUser.scss";

const ManageUser = () => {
  const menuItems = [
    { id: 1, label: "Trang chủ", link: "/adminpage" },
    { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
    { id: 3, label: "Quản lý banner", link: "/banner-management" },
    { id: 4, label: "Quản lý danh mục", link: "/category-management" },
    { id: 5, label: "Quản lý bài đăng", link: "/managepost" },
    { id: 6, label: "Thống kê", link: "/statistic" },
  ];

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    gender: true,
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    displayName: "",
    gender: "",
  });
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
      return;
    }

    fetch("https://localhost:7128/api/User/role/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi tải danh sách người dùng!");
        }
        return response.json();
      })
      .then((data) => {
        const usersData = Array.isArray(data) ? data : [data];
        setUsers(usersData);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        toast.error(error.message || "Lỗi khi tải danh sách người dùng!");
      });
  };

  const fetchUserInfo = (id) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
      return;
    }

    fetch(`https://localhost:7128/api/User/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi tải thông tin người dùng!");
        }
        return response.json();
      })
      .then((data) => {
        setSelectedUser(data);
        setShowUserInfoModal(true);
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        toast.error(error.message || "Lỗi khi tải thông tin người dùng!");
      });
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email là bắt buộc.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ.";
    return "";
  };

  const validatePassword = (password) => {
    if (!password.trim()) return "Mật khẩu là bắt buộc.";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    return "";
  };

  const validateDisplayName = (displayName) => {
    if (!displayName.trim()) return "Tên hiển thị là bắt buộc.";
    if (displayName.length < 2) return "Tên hiển thị phải có ít nhất 2 ký tự.";
    if (displayName.length > 50) return "Tên hiển thị không được vượt quá 50 ký tự.";
    return "";
  };

  const validateGender = (gender) => {
    if (gender !== true && gender !== false) return "Giới tính không hợp lệ.";
    return "";
  };

  const handleSubmit = () => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      displayName: validateDisplayName(formData.displayName),
      gender: validateGender(formData.gender),
    };

    setFormErrors(errors);

    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      Object.values(errors).forEach((error) => {
        if (error) toast.error(error);
      });
      return;
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
      return;
    }

    const payload = { ...formData, role: "Admin" }; // Force role to Admin

    fetch("https://localhost:7128/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = { message: await response.text() };
        }

        if (!response.ok) {
          throw new Error(data.message || "Lỗi khi tạo tài khoản admin!");
        }
        return data;
      })
      .then((data) => {
        toast.success(data.message || "Tạo tài khoản admin thành công!");
        setShowAddAdminModal(false);
        setFormErrors({
          email: "",
          password: "",
          displayName: "",
          gender: "",
        });
        fetchUsers();
      })
      .catch((error) => {
        console.error("Error creating admin:", error);
        toast.error(error.message || "Lỗi khi tạo tài khoản admin!");
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const filteredUsers = users.filter((user) => {
    const matchesKeyword = (user.displayName || "")
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const statusText = user.status === 0 ? "active" : "banned";
    const matchesStatus = filterStatus ? statusText === filterStatus : true;
    const matchesRole = filterRole ? user.role === filterRole : true;
    return matchesKeyword && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleToggleStatus = (id, currentStatus) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
      return;
    }

    const apiUrl =
      currentStatus === 0
        ? "https://localhost:7128/api/User/ban"
        : "https://localhost:7128/api/User/unban";

    const payload = {
      userId: id,
      reason:
        currentStatus === 0
          ? "Vi phạm điều khoản sử dụng"
          : "Xem xét lại và mở khóa",
    };

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === id ? { ...user, status: currentStatus === 0 ? 1 : 0 } : user
            )
          );
          toast.success(
            currentStatus === 0
              ? "User đã bị khóa thành công!"
              : "User đã được mở khóa thành công!"
          );
        } else {
          toast.error("Không thể thực hiện thay đổi trạng thái!");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("Có lỗi xảy ra khi kết nối API!");
      });
  };

  const handleAddAdmin = () => {
    setFormData({
      email: "",
      password: "",
      displayName: "",
      gender: true,
    });
    setFormErrors({
      email: "",
      password: "",
      displayName: "",
      gender: "",
    });
    setShowAddAdminModal(true);
  };

  return (
    <div className="banner-page manage-user">
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} activeItem={2} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <h1>Quản lý Người dùng</h1>
            <div className="d-flex justify-content-between mb-3 align-items-center">
              <Button variant="primary" onClick={handleAddAdmin}>
                Thêm Admin
              </Button>
              <div className="d-flex align-items-center">
                <Form.Select
                  className="me-2"
                  style={{ maxWidth: "180px", maxHeight: "48px" }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </Form.Select>
                <Form.Select
                  className="me-2"
                  style={{ maxWidth: "150px", maxHeight: "48px" }}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </Form.Select>
                <Form className="d-flex" style={{ maxWidth: "200px", maxHeight: "48px" }}>
                  <Form.Control
                    type="text"
                    placeholder="Tìm theo tên"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="search-input"
                  />
                </Form>
              </div>
            </div>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Số thứ tự</th>
                  <th>ID người dùng</th>
                  <th>Tên</th>
                  <th>Giới tính</th>
                  <th>Trạng thái</th>
                  <th>Role</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{indexOfFirstUser + index + 1}</td>
                      <td>{user.id}</td>
                      <td>{user.displayName}</td>
                      <td>{user.gender ? "Nam" : "Nữ"}</td>
                      <td>{user.status === 0 ? "Active" : "Banned"}</td>
                      <td>{user.role}</td>
                      <td>
                        <Button
                          variant={user.status === 0 ? "danger" : "success"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className="me-2"
                        >
                          {user.status === 0 ? (
                            <>
                              <FaLock className="me-1" /> Khóa
                            </>
                          ) : (
                            <>
                              <FaUnlock className="me-1" /> Mở khóa
                            </>
                          )}
                        </Button>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => fetchUserInfo(user.id)}
                        >
                          <FaInfoCircle className="me-1" /> Thông tin
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">Không tìm thấy người dùng nào.</td>
                  </tr>
                )}
              </tbody>
            </Table>
            <div className="pagination-container text-center">
              <Pagination>
                <Pagination.First
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={currentPage === i + 1}
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    currentPage < totalPages && paginate(currentPage + 1)
                  }
                />
                <Pagination.Last
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Add Admin Modal */}
      <Modal show={showAddAdminModal} onHide={() => setShowAddAdminModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <div className="mb-3">
              <label>Email <span style={{ color: "red" }}>*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                placeholder="Nhập email admin"
                required
              />
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
            </div>
            <div className="mb-3">
              <label>Mật khẩu <span style={{ color: "red" }}>*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${formErrors.password ? "is-invalid" : ""}`}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                required
              />
              {formErrors.password && (
                <div className="invalid-feedback">{formErrors.password}</div>
              )}
            </div>
            <div className="mb-3">
              <label>Tên hiển thị <span style={{ color: "red" }}>*</span></label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`form-control ${formErrors.displayName ? "is-invalid" : ""}`}
                placeholder="Nhập tên hiển thị"
                required
              />
              {formErrors.displayName && (
                <div className="invalid-feedback">{formErrors.displayName}</div>
              )}
            </div>
            <div className="mb-3">
              <label>Giới tính</label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={formErrors.gender ? "is-invalid" : ""}
              >
                <option value={true}>Nam</option>
                <option value={false}>Nữ</option>
              </Form.Select>
              {formErrors.gender && (
                <div className="invalid-feedback">{formErrors.gender}</div>
              )}
            </div>
            <Button variant="primary" onClick={handleSubmit}>
              Thêm
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* User Info Modal */}
      <Modal show={showUserInfoModal} onHide={() => setShowUserInfoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thông tin Người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser ? (
            <div>
              <p><strong>Tên hiển thị:</strong> {selectedUser.displayName}</p>
              <p><strong>Email:</strong> {selectedUser.name || "N/A"}</p>
              <p><strong>Giới tính:</strong> {selectedUser.gender ? "Nam" : "Nữ"}</p>
              <p><strong>Tuổi:</strong> {selectedUser.age || "N/A"}</p>
              <p><strong>Địa chỉ:</strong> {selectedUser.address || "N/A"}</p>
              <p><strong>Số điện thoại:</strong> {selectedUser.phone || "N/A"}</p>
              <p><strong>Trạng thái:</strong> {selectedUser.status === 0 ? "Active" : "Banned"}</p>
              <p><strong>Đánh giá trung bình:</strong> {selectedUser.rating?.toFixed(2) || "0.00"}</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              <p><strong>Ngân hàng:</strong> {selectedUser.bankName || "N/A"}</p>
              <p><strong>Số tài khoản:</strong> {selectedUser.bankAccount || "N/A"}</p>
              <p><strong>Tên tài khoản:</strong> {selectedUser.bankAccountName || "N/A"}</p>
              {selectedUser.avatar && (
                <p><strong>Avatar:</strong> <img src={selectedUser.avatar} alt="Avatar" style={{ maxWidth: "100px" }} /></p>
              )}
            </div>
          ) : (
            <p>Không có thông tin người dùng.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserInfoModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ManageUser;