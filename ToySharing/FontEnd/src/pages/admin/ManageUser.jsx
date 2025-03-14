import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Pagination,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaLock, FaUnlock } from "react-icons/fa";
import AdminSideMenu from "../../components/AdminSideMenu";
import "./ManageUser.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageUser = () => {
  // Menu dành cho AdminSideMenu
  const menuItems = [
    { id: 1, label: "Trang chủ", link: "/adminpage" },
    { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
    { id: 3, label: "Duyệt bài đăng", link: "/checkingpost" },
    { id: 4, label: "Quản lý vi phạm", link: "/managefeedback" },
    { id: 5, label: "Thống kê", link: "/statistic" },
  ];

  // Các trạng thái tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState(null);

  // Dữ liệu mẫu cho người dùng (10 dòng)
  const initialUsers = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      gender: "Nam",
      childAge: 5,
      status: "active",
      role: "user",
      createdAt: "2023-07-01",
    },
    {
      id: 2,
      name: "Trần Thị B",
      gender: "Nữ",
      childAge: 3,
      status: "locked",
      role: "user",
      createdAt: "2023-07-02",
    },
    {
      id: 3,
      name: "Lê Văn C",
      gender: "Nam",
      childAge: 4,
      status: "active",
      role: "admin",
      createdAt: "2023-07-03",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      gender: "Nữ",
      childAge: 6,
      status: "active",
      role: "user",
      createdAt: "2023-07-04",
    },
    {
      id: 5,
      name: "Hoàng Văn E",
      gender: "Nam",
      childAge: 2,
      status: "locked",
      role: "user",
      createdAt: "2023-07-05",
    },
    {
      id: 6,
      name: "Đặng Thị F",
      gender: "Nữ",
      childAge: 5,
      status: "active",
      role: "user",
      createdAt: "2023-07-06",
    },
    {
      id: 7,
      name: "Nguyễn Thị G",
      gender: "Nữ",
      childAge: 3,
      status: "active",
      role: "admin",
      createdAt: "2023-07-07",
    },
    {
      id: 8,
      name: "Lê Thị H",
      gender: "Nữ",
      childAge: 4,
      status: "locked",
      role: "user",
      createdAt: "2023-07-08",
    },
    {
      id: 9,
      name: "Trần Văn I",
      gender: "Nam",
      childAge: 6,
      status: "active",
      role: "user",
      createdAt: "2023-07-09",
    },
    {
      id: 10,
      name: "Phạm Văn J",
      gender: "Nam",
      childAge: 5,
      status: "active",
      role: "user",
      createdAt: "2023-07-10",
    },
  ];

  const [users, setUsers] = useState(initialUsers);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Lọc dữ liệu người dùng theo từ khóa, trạng thái và ngày (createdAt)
  const filteredUsers = users.filter((user) => {
    const matchesKeyword = user.name
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const matchesStatus = filterStatus ? user.status === filterStatus : true;
    const matchesDate = filterDate
      ? user.createdAt === filterDate.toISOString().split("T")[0]
      : true;
    return matchesKeyword && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Hành động thay đổi trạng thái: nếu active -> khóa, nếu locked -> mở khóa
  const handleToggleStatus = (id) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "active" ? "locked" : "active" }
          : user
      )
    );
    toast.success("Cập nhật trạng thái thành công!");
  };

  // Hành động thay đổi role
  const handleRoleChange = (id, newRole) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, role: newRole } : user
      )
    );
    toast.success("Cập nhật role thành công!");
  };

  return (
    <div className="manage-user-page home-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Admin Side Menu */}
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} activeItem={2} />
          </Col>
          {/* Main Content với chiều rộng 70vw */}
          <Col xs={12} md={10} className="main-content">
            {/* Thanh tìm kiếm */}
            <Form className="mb-4">
              <Row>
                <Col xs={12} md={4} className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm theo tên"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </Col>
                <Col xs={12} md={4} className="mb-3">
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="active">Active</option>
                    <option value="locked">Khóa</option>
                  </Form.Select>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                  <DatePicker
                    selected={filterDate}
                    onChange={(date) => setFilterDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    placeholderText="Chọn ngày"
                  />
                </Col>
              </Row>
              <Button variant="primary" type="submit">
                Áp dụng
              </Button>
            </Form>
            {/* Bảng danh sách người dùng */}
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giới tính</th>
                  <th>Tuổi bé</th>
                  <th>Trạng thái</th>
                  <th>Action</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.gender}</td>
                    <td>{user.childAge}</td>
                    <td>{user.status === "active" ? "Active" : "Khóa"}</td>
                    <td>
                      <Button
                        variant={
                          user.status === "active" ? "danger" : "success"
                        }
                        size="sm"
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status === "active" ? (
                          <>
                            <FaLock className="me-1" /> Khóa
                          </>
                        ) : (
                          <>
                            <FaUnlock className="me-1" /> Mở khóa
                          </>
                        )}
                      </Button>
                    </td>
                    <td>
                      <Form.Select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {/* Thanh phân trang */}
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
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ManageUser;
