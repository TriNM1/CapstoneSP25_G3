import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button, Modal, Form, Pagination } from "react-bootstrap";
import axios from "axios";
import AdminSideMenu from "../../components/AdminSideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CategoryManagement.scss";

const API_BASE_URL = "https://localhost:7128/api/admin"; // Backend base URL

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({
        categoryName: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Số danh mục mỗi trang

    const menuItems = [
        { id: 1, label: "Trang chủ", link: "/adminpage" },
        { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
        { id: 3, label: "Quản lý banner", link: "/banner-management" },
        { id: 4, label: "Quản lý danh mục", link: "/category-management" },
        { id: 5, label: "Quản lý bài đăng", link: "/managepost" },
        { id: 6, label: "Thống kê", link: "/statistic" },
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
            });
            if (Array.isArray(response.data)) {
                setCategories(response.data);
                setFilteredCategories(response.data);
            } else {
                console.error("Expected an array from API but got:", response.data);
                setCategories([]);
                setFilteredCategories([]);
                toast.error("Dữ liệu nhận được không đúng định dạng.");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
            setFilteredCategories([]);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi tải danh sách danh mục. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filtered = categories.filter((category) =>
            category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCategories(filtered);
        setCurrentPage(1);
    }, [searchTerm, categories]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleAddCategory = () => {
        setIsEditing(false);
        setFormData({
            categoryName: "",
        });
        setShowModal(true);
    };

    const handleEditCategory = (category) => {
        setIsEditing(true);
        setCurrentCategory(category);
        setFormData({
            categoryName: category.categoryName,
        });
        setShowModal(true);
    };

    const handleDeleteCategory = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/categories/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
            });
            toast.success("Xóa danh mục thành công!");
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi xóa danh mục. Vui lòng thử lại.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.categoryName.trim()) {
            toast.error("Tên danh mục là bắt buộc.");
            return;
        }

        const data = {
            categoryName: formData.categoryName,
        };

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/categories/${currentCategory.categoryId}`, data, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                });
                toast.success("Cập nhật danh mục thành công!");
            } else {
                await axios.post(`${API_BASE_URL}/categories`, data, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                });
                toast.success("Thêm danh mục thành công!");
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi lưu danh mục. Vui lòng thử lại.");
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="banner-page category-management">
            <Container fluid className="mt-4">
                <Row>
                    <Col xs={12} md={2}>
                        <AdminSideMenu menuItems={menuItems} />
                    </Col>
                    <Col xs={12} md={10} className="main-content">
                        <h1>Quản lý Danh mục</h1>
                        <div className="d-flex justify-content-between mb-3">
                            <Button variant="primary" onClick={handleAddCategory}>
                                Thêm Danh mục
                            </Button>
                            <Form className="d-flex search-form">
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm kiếm danh mục..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </Form>
                        </div>
                        <Table striped bordered hover className="mt-3">
                            <thead>
                                <tr>
                                    <th>Số thứ tự</th>
                                    <th>Tên danh mục</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3">Đang tải...</td>
                                    </tr>
                                ) : Array.isArray(currentItems) ? (
                                    currentItems.length > 0 ? (
                                        currentItems.map((category, index) => (
                                            <tr key={category.categoryId}>
                                                <td>{indexOfFirstItem + index + 1}</td>
                                                <td>{category.categoryName}</td>
                                                <td>
                                                    <Button
                                                        variant="warning"
                                                        onClick={() => handleEditCategory(category)}
                                                    >
                                                        Sửa
                                                    </Button>{" "}
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleDeleteCategory(category.categoryId)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">Không tìm thấy danh mục nào.</td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan="3">Lỗi khi tải dữ liệu danh mục.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {totalPages > 1 && (
                            <Pagination className="justify-content-center">
                                <Pagination.Prev
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                />
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() => paginate(index + 1)}
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        )}
                    </Col>
                </Row>
            </Container>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Sửa Danh mục" : "Thêm Danh mục"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div className="mb-3">
                            <label>Tên danh mục <span style={{ color: "red" }}>*</span></label>
                            <input
                                type="text"
                                name="categoryName"
                                value={formData.categoryName}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <Button variant="primary" onClick={handleSubmit}>
                            {isEditing ? "Cập nhật" : "Thêm"}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default CategoryManagement;