import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button, Modal } from "react-bootstrap";
import axios from "axios";
import AdminSideMenu from "../../components/AdminSideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./BannerManagement.scss";

const API_BASE_URL = "https://localhost:7128/api/admin"; // Backend base URL

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        linkUrl: "",
        status: "",
        priority: "",
        image: null,
    });

    const menuItems = [
        { id: 1, label: "Trang chủ", link: "/adminpage" },
        { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
        { id: 3, label: "Quản lý Banner", link: "/banner-management" },
        { id: 4, label: "Quản lý bài đăng", link: "/managepost" },
        { id: 5, label: "Thống kê", link: "/statistic" },
    ];

    const statusTypeMap = {
        0: "Hiện",
        1: "Ẩn",
      };

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/banners`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
            });
            if (Array.isArray(response.data)) {
                setBanners(response.data);
            } else {
                console.error("Expected an array from API but got:", response.data);
                setBanners([]);
                toast.error("Dữ liệu nhận được không đúng định dạng.");
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
            setBanners([]);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi tải danh sách banner. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddBanner = () => {
        setIsEditing(false);
        setFormData({
            title: "",
            linkUrl: "",
            status: "",
            priority: "",
            image: null,
        });
        setShowModal(true);
    };

    const handleEditBanner = (banner) => {
        setIsEditing(true);
        setCurrentBanner(banner);
        setFormData({
            title: banner.title,
            linkUrl: banner.linkUrl || "",
            status: banner.status,
            priority: banner.priority || 0,
            image: null,
        });
        setShowModal(true);
    };

    const handleDeleteBanner = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/banners/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
            });
            toast.success("Xóa banner thành công!");
            fetchBanners();
        } catch (error) {
            console.error("Error deleting banner:", error);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi xóa banner. Vui lòng thử lại.");
            }
        }
    };

    const handleSubmit = async () => {
        // Validation for required fields
        if (!formData.title.trim()) {
            toast.error("Tiêu đề là bắt buộc.");
            return;
        }
        if (formData.status === "" || isNaN(formData.status)) {
            toast.error("Trạng thái là bắt buộc và phải là số.");
            return;
        }
        if (Number(formData.status) < 0) {
            toast.error("Trạng thái phải là số lớn hơn 0.");
            return;
        }
        if (formData.priority === "" || isNaN(formData.priority)) {
            toast.error("Mức độ ưu tiên là bắt buộc và phải là số.");
            return;
        }
        if (Number(formData.priority) < 0) {
            toast.error("Mức độ ưu tiên phải là số lớn hơn 0.");
            return;
        }
        if (!isEditing && !formData.image) {
            toast.error("Ảnh là bắt buộc khi thêm banner mới.");
            return;
        }

        const data = new FormData();
        data.append("title", formData.title);
        data.append("linkUrl", formData.linkUrl);
        data.append("status", formData.status);
        data.append("priority", formData.priority);
        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/banners/${currentBanner.bannerId}`, data, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                toast.success("Cập nhật banner thành công!");
            } else {
                await axios.post(`${API_BASE_URL}/banners`, data, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                toast.success("Thêm banner thành công!");
            }
            setShowModal(false);
            fetchBanners();
        } catch (error) {
            console.error("Error saving banner:", error);
            if (error.response?.status === 401) {
                toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            } else {
                toast.error("Lỗi khi lưu banner. Vui lòng thử lại.");
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    return (
        <div className="admin-page banner-management">
            <Container fluid className="mt-4">
                <Row>
                    <Col xs={12} md={2}>
                        <AdminSideMenu menuItems={menuItems} />
                    </Col>
                    <Col xs={12} md={10} className="main-content">
                        <h1>Quản lý Banner</h1>
                        <Button variant="primary" onClick={handleAddBanner}>
                            Thêm Banner
                        </Button>
                        <Table striped bordered hover className="mt-3">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tiêu đề</th>
                                    <th>Ảnh banner</th>
                                    <th>Liên kết tới</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7">Đang tải...</td>
                                    </tr>
                                ) : Array.isArray(banners) ? (
                                    banners.length > 0 ? (
                                        banners.map((banner) => (
                                            <tr key={banner.bannerId}>
                                                <td>{banner.bannerId}</td>
                                                <td>{banner.title}</td>
                                                <td>
                                                    <img src={banner.imageUrl} alt={banner.title} width="100" />
                                                </td>
                                                <td>{banner.linkUrl || "Không có"}</td>
                                                <td>{statusTypeMap[banner.status] || "Không xác định"}</td>
                                                <td>
                                                    <Button
                                                        variant="warning"
                                                        onClick={() => handleEditBanner(banner)}
                                                    >
                                                        Sửa
                                                    </Button>{" "}
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleDeleteBanner(banner.bannerId)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7">Không có banner nào.</td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan="7">Lỗi khi tải dữ liệu banner.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Container>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Sửa Banner" : "Thêm Banner"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div className="mb-3">
                            <label>Tiêu đề <span style={{ color: "red" }}>*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label>Liên kết</label>
                            <input
                                type="text"
                                name="linkUrl"
                                value={formData.linkUrl}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Trạng thái <span style={{ color: "red" }}>*</span></label>
                            <input
                                type="text"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-control"
                                required
                                min="1"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Ưu tiên <span style={{ color: "red" }}>*</span></label>
                            <input
                                type="text"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="form-control"
                                required
                                min="1"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Ảnh {isEditing ? "" : <span style={{ color: "red" }}>*</span>}</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="form-control"
                                accept="image/*"
                                required={!isEditing}
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

export default BannerManagement;