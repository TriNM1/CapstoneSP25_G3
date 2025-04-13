import React, { useState, useEffect } from "react";
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
    // { id: 3, label: "Quản lý vi phạm", link: "/managefeedback" },
    { id: 3, label: "Thống kê", link: "/statistic" },
  ];

  // Các trạng thái tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState(null);

  // Khởi tạo state users rỗng. API sẽ cung cấp dữ liệu
  const [users, setUsers] = useState([]);

  // Phân trang (có thể vẫn giữ nếu API trả về nhiều dữ liệu)
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Gọi API để lấy danh sách user có role "user"
  useEffect(() => {
    fetch("https://localhost:7128/api/User/role/user")
      .then((response) => response.json())
      .then((data) => {
        // Nếu API trả về 1 đối tượng (không phải mảng), bọc nó thành mảng
        const usersData = Array.isArray(data) ? data : [data];
        setUsers(usersData);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  // Lọc danh sách người dùng theo tìm kiếm và trạng thái
  // Lưu ý: Nếu API không trả về createdAt, có thể loại bỏ bộ lọc DatePicker
  const filteredUsers = users.filter((user) => {
    const matchesKeyword = (user.displayName || "")
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    // Chuyển trạng thái số thành text để so sánh: 1 -> "active", 0 -> "banned"
    const statusText = user.status === 1 ? "active" : "banned";
    const matchesStatus = filterStatus ? statusText === filterStatus : true;
    // Nếu không có createdAt từ API, có thể bỏ qua bộ lọc ngày
    const matchesDate = filterDate ? false : true;
    return matchesKeyword && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Hàm xử lý ban/unban tích hợp gọi API
  const handleToggleStatus = (id, currentStatus) => {
    // Nếu status hiện tại là 1 (active) thì gọi API ban, ngược lại gọi API unban
    const apiUrl =
      currentStatus === 1
        ? "https://localhost:7128/api/User/ban"
        : "https://localhost:7128/api/User/unban";

    const payload = {
      userId: id,
      reason:
        currentStatus === 1
          ? "Vi phạm điều khoản sử dụng"
          : "Xem xét lại và mở khóa",
    };

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          // Update trạng thái user trong state
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === id ? { ...user, status: currentStatus === 1 ? 0 : 1 } : user
            )
          );
          toast.success(
            currentStatus === 1
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

  // Hành động thay đổi role
  // const handleRoleChange = (id, newRole) => {
  //   setUsers((prevUsers) =>
  //     prevUsers.map((user) =>
  //       user.id === id ? { ...user, role: newRole } : user
  //     )
  //   );
  //   toast.success("Cập nhật role thành công!");
  // };

  return (
    <div className="manage-user-page home-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Admin Side Menu */}
          <Col xs={12} md={2}>
            <AdminSideMenu menuItems={menuItems} activeItem={2} />
          </Col>
          {/* Main Content */}
          <Col xs={12} md={10} className="main-content">
            {/* Thanh tìm kiếm */}
            <Form className="mb-4" onSubmit={(e) => e.preventDefault()}>
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
                    <option value="banned">Banned</option>
                  </Form.Select>
                </Col>
                <Col xs={12} md={4} className="mb-3">
                  {/* Nếu API không chứa createdAt, bạn có thể xóa DatePicker đi */}
                  {/* <DatePicker
                    selected={filterDate}
                    onChange={(date) => setFilterDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    placeholderText="Chọn ngày"
                  /> */}
                </Col>
              </Row>
              <Button variant="primary" type="submit">
                Tìm kiếm
              </Button>
            </Form>
            {/* Bảng danh sách người dùng */}
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giới tính</th>
                  <th>Trạng thái</th>
                  <th>Action</th>
                  {/* <th>Role</th> */}
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.displayName}</td>
                    <td>{user.gender ? "Nam" : "Nữ"}</td>
                    <td>{user.status === 1 ? "Active" : "Banned"}</td>
                    <td>
                      <Button
                        variant={user.status === 1 ? "danger" : "success"}
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.status)}
                      >
                        {user.status === 1 ? (
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
                    {/* <td>
                      <Form.Select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </Form.Select>
                    </td> */}
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
                  onClick={() =>
                    currentPage > 1 && paginate(currentPage - 1)
                  }
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