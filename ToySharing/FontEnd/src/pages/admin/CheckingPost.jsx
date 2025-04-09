import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Spinner,
  Carousel,
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminSideMenu from "../../components/AdminSideMenu";
import defaultImage from "../../assets/toy1.jpg";
import "./CheckingPost.scss";

const CheckingPost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // Fetch data từ API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("https://localhost:7128/api/Products");
        if (!response.ok) throw new Error("Không thể tải dữ liệu");
        const data = await response.json();

        const formattedPosts = data.map((product) => ({
          ...product,
          priceFormatted: product.price
            ? `${product.price.toLocaleString("vi-VN")} VND`
            : "Liên hệ",
          createdAtFormatted: new Date(product.createdAt).toLocaleDateString(
            "vi-VN"
          ),
        }));

        setPosts(formattedPosts);
      } catch (err) {
        setError(err.message);
        toast.error("Lỗi khi tải bài đăng");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Xử lý hiển thị modal chi tiết
  const handleShowDetail = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  // Xử lý đóng modal
  const handleCloseModals = () => {
    setShowDetailModal(false);
    setShowBlockModal(false);
    setBlockReason("");
    setSelectedProduct(null);
  };

  // Xử lý duyệt bài
  const handleApprove = async (productId) => {
    try {
      const response = await fetch(
        `https://localhost:7128/api/Products/${productId}/approve`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) throw new Error("Duyệt bài thất bại");

      setPosts((prev) => prev.filter((p) => p.productId !== productId));
      toast.success("Duyệt thành công!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Xử lý từ chối bài
  const handleReject = () => {
    if (!blockReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối!");
      return;
    }
    // Gọi API từ chối ở đây
    console.log(
      "Từ chối bài:",
      selectedProduct.productId,
      "Lý do:",
      blockReason
    );
    setPosts((prev) =>
      prev.filter((p) => p.productId !== selectedProduct.productId)
    );
    toast.success("Đã từ chối bài đăng");
    handleCloseModals();
  };

  // Lọc bài đăng
  const filteredPosts = posts.filter((post) =>
    post.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="checking-post-page">
      <Container fluid className="mt-4">
        <Row>
          <Col md={2}>
            <AdminSideMenu
              menuItems={[
                { id: 1, label: "Trang chủ", link: "/adminpage" },
                { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
                { id: 3, label: "Duyệt bài đăng", link: "/checkingpost" },
                { id: 4, label: "Quản lý vi phạm", link: "/managefeedback" },
                { id: 5, label: "Thống kê", link: "/statistic" },
              ]}
            />
          </Col>

          <Col md={10} className="main-content">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mb-4"
            />

            {loading ? (
              <div className="text-center">
                <Spinner animation="border" />
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <Row>
                {filteredPosts.map((product) => (
                  <Col key={product.productId} md={4} className="mb-4">
                    <Card
                      onClick={() => handleShowDetail(product)}
                      className="post-card"
                    >
                      <Card.Img
                        variant="top"
                        src={product.imagePaths?.[0] || defaultImage}
                        className="post-image"
                        onError={(e) => {
                          e.target.src = defaultImage;
                        }}
                      />
                      <Card.Body>
                        <Card.Title>{product.name}</Card.Title>
                        <div
                          className="post-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="success"
                            className="me-2"
                            onClick={() => handleApprove(product.productId)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowBlockModal(true);
                            }}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal chi tiết sản phẩm */}
      <Modal show={showDetailModal} onHide={handleCloseModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <Carousel>
                {selectedProduct.imagePaths?.map((img, index) => (
                  <Carousel.Item key={index}>
                    <img
                      className="d-block w-100"
                      src={img}
                      alt={`Ảnh ${index + 1}`}
                      onError={(e) => {
                        e.target.src = defaultImage;
                      }}
                    />
                  </Carousel.Item>
                ))}
              </Carousel>

              <div className="product-details mt-4">
                <p>
                  <strong>Mã sản phẩm:</strong> {selectedProduct.productId}
                </p>
                <p>
                  <strong>Danh mục:</strong>{" "}
                  {selectedProduct.categoryName || "Chưa phân loại"}
                </p>
                <p>
                  <strong>Giá:</strong> {selectedProduct.priceFormatted}
                </p>
                <p>
                  <strong>Độ tuổi phù hợp:</strong>{" "}
                  {selectedProduct.suitableAge}
                </p>
                <p>
                  <strong>Số lượng:</strong> {selectedProduct.available}
                </p>
                <p>
                  <strong>Ngày đăng:</strong>{" "}
                  {selectedProduct.createdAtFormatted}
                </p>
                <p>
                  <strong>Trạng thái:</strong> {selectedProduct.productStatus}
                </p>
                <p>
                  <strong>Mô tả:</strong> {selectedProduct.description}
                </p>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal từ chối */}
      <Modal show={showBlockModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>Lý do từ chối</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              as="textarea"
              rows={3}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleReject}>
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CheckingPost;
