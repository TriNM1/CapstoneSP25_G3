import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Pagination,
  Modal,
  Image,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdminSideMenu from "../../components/AdminSideMenu";
import userPlaceholder from "../../assets/user.png";
import "./ManagerPost.scss";

const ManagePost = () => {
  // Bộ lọc: tên đồ chơi, tên người dùng, danh mục (với giá trị là chỉ số 0-indexed dưới dạng chuỗi)
  const [toySearch, setToySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // State cho sản phẩm, phân trang ...
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Mapping userId -> displayName
  const [userNames, setUserNames] = useState({});

  // Danh mục: lấy từ API /api/Products/categories, API trả về mảng chuỗi, ví dụ: ["Gau bong", "Xe oto"]
  const [categories, setCategories] = useState([]);

  // Modal chi tiết sản phẩm
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State để lưu trữ các sản phẩm được chọn
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Fetch sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("https://localhost:7128/api/Products");
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu đồ chơi");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

  // Fetch tên người dùng cho các userId chưa có trong mapping
  useEffect(() => {
    const uniqueUserIds = Array.from(
      new Set(products.map((p) => p.userId))
    ).filter((userId) => !userNames[userId]);
    uniqueUserIds.forEach(async (userId) => {
      try {
        const res = await fetch(`https://localhost:7128/api/User/${userId}`);
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu người dùng");
        const data = await res.json();
        // Giả sử API trả về trường "displayName"
        setUserNames((prevState) => ({
          ...prevState,
          [userId]: data.displayName,
        }));
      } catch (error) {
        console.error(error);
      }
    });
  }, [products, userNames]);

  // Fetch danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          "https://localhost:7128/api/Products/categories"
        );
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu danh mục");
        const data = await res.json();
        console.log("Categories data:", data);
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  // Lọc các sản phẩm theo tên đồ chơi, tên người đăng và danh mục
  const filteredProducts = products.filter((product) => {
    const toyName = product.name || "";
    const displayName = userNames[product.userId] || "";
    const productCategoryName = product.categoryName || "";

    const toyMatch = toyName.toLowerCase().includes(toySearch.toLowerCase());
    const userMatch = displayName
      .toLowerCase()
      .includes(userSearch.toLowerCase());
    const categoryMatch =
      selectedCategory === "" || productCategoryName === selectedCategory;

    return toyMatch && userMatch && categoryMatch;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Mở modal hiển thị chi tiết sản phẩm
  const handleDetailClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  // Hàm xóa sản phẩm
  const handleDeleteProduct = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!productId) {
      alert("Không tìm thấy ID sản phẩm.");
      return;
    }
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
    );
    if (!confirmDelete) return;
    try {
      const res = await fetch(
        `https://localhost:7128/api/Products/admin/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
            accept: "*/*",
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          alert("Bạn chưa đăng nhập hoặc không có quyền xóa sản phẩm.");
        } else if (res.status === 400) {
          alert("Không thể xóa sản phẩm vì sản phẩm đang được cho mượn.");
        } else {
          throw new Error("Lỗi khi xóa sản phẩm");
        }
        return;
      }
      setProducts(products.filter((p) => p.productId !== productId));
      alert("Sản phẩm đã được xóa thành công.");
      setShowDetailModal(false);
    } catch (error) {
      console.error(error);
      alert("Xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau!");
    }
  };

  // Hàm xóa hàng loạt các sản phẩm đã chọn
  const handleDeleteSelectedProducts = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa các sản phẩm đã chọn? Hành động này không thể hoàn tác."
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
      return;
    }

    try {
      const deletePromises = selectedProducts.map((productId) =>
        fetch(`https://localhost:7128/api/Products/admin/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
          },
        })
      );

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        setProducts(
          products.filter((p) => !selectedProducts.includes(p.productId))
        );
        setSelectedProducts([]);
        alert("Các sản phẩm đã được xóa thành công.");
      } else {
        // Log chi tiết lỗi cho từng sản phẩm không xóa được
        results.forEach((res, index) => {
          if (!res.ok) {
            if (res.status === 401) {
              alert("Bạn chưa đăng nhập hoặc không có quyền xóa sản phẩm.");
            } else if (res.status === 400) {
              alert("Không thể xóa sản phẩm vì sản phẩm đang được cho mượn.");
            }
            console.error(
              `Lỗi khi xóa sản phẩm ID ${selectedProducts[index]}: ${res.status} ${res.statusText}`
            );
          }
        });
        throw new Error("Lỗi khi xóa một số sản phẩm");
      }
    } catch (error) {
      console.error(error);
      // alert("Xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau!");
    }
  };

  // Hàm xử lý khi nhấn nút "Chọn tất cả"
  const handleSelectAll = () => {
    // Lấy tất cả productId của các sản phẩm hiển thị trên màn hình
    const allProductIds = currentItems.map((product) => product.productId);

    // Kiểm tra xem tất cả các sản phẩm đã được chọn chưa
    const allSelected = allProductIds.every((id) =>
      selectedProducts.includes(id)
    );

    if (allSelected) {
      // Nếu tất cả đã được chọn, bỏ chọn tất cả
      setSelectedProducts(
        selectedProducts.filter((id) => !allProductIds.includes(id))
      );
    } else {
      // Nếu chưa, thêm tất cả vào danh sách đã chọn
      setSelectedProducts([
        ...new Set([...selectedProducts, ...allProductIds]),
      ]);
    }
  };

  return (
    <div className="manage-post admin-page">
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <AdminSideMenu
              menuItems={[
                { id: 1, label: "Trang chủ", link: "/adminpage" },
                { id: 2, label: "Quản lý người dùng", link: "/manageuser" },
                { id: 3, label: "Quản lý banner", link: "/banner-management" },
                { id: 4, label: "Quản lý bài đăng", link: "/managepost" },
                { id: 5, label: "Thống kê", link: "/statistic" },
              ]}
            />
          </Col>

          <Col xs={12} md={8} className="main-content">
            {/* Phần bộ lọc */}
            <Row className="filter-section mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tên đồ chơi:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên đồ chơi"
                    value={toySearch}
                    onChange={(e) => setToySearch(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tên người đăng:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên người đăng"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Danh mục:</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {categories.map((catName, index) => (
                      <option key={index} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            {/* Nút xóa hàng loạt */}
            <Row className="mb-4">
              <Col>
                <Button
                  variant="primary"
                  onClick={handleSelectAll}
                  style={{ marginRight: "10px" }}
                >
                  {selectedProducts.length === currentItems.length &&
                    currentItems.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>

                <Button
                  variant="danger"
                  disabled={selectedProducts.length === 0}
                  onClick={handleDeleteSelectedProducts}
                >
                  Xóa các sản phẩm đã chọn
                </Button>
              </Col>
            </Row>

            {/* Danh sách sản phẩm */}
            <Row className="post-item">
              {currentItems.map((product) => (
                <Col md={4} key={product.productId} className="mb-3">
                  <div
                    className="product-card"
                    style={{ cursor: "pointer", position: "relative" }}
                  >
                    <Form.Check
                      type="checkbox"
                      checked={selectedProducts.includes(product.productId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedProducts([
                            ...selectedProducts,
                            product.productId,
                          ]);
                        } else {
                          setSelectedProducts(
                            selectedProducts.filter(
                              (id) => id !== product.productId
                            )
                          );
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                      }}
                    />
                    <Image
                      src={product.imagePaths?.[0] || userPlaceholder}
                      thumbnail
                      alt={product.name}
                    />
                    <h5
                      className="mt-2"
                      onClick={() => handleDetailClick(product)}
                    >
                      {product.name}
                    </h5>
                    <p>
                      Người đăng: {userNames[product.userId] || product.userId}
                    </p>
                    <p>Danh mục: {product.categoryName || "No Category"}</p>
                    <p>
                      Ngày đăng:{" "}
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Phân trang */}
            {/* <Pagination>
              {[...Array(totalPages).keys()].map((number) => (
                <Pagination.Item
                  key={number + 1}
                  active={currentPage === number + 1}
                  onClick={() => paginate(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
            </Pagination> */}

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

      {/* Modal chi tiết sản phẩm */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <Image
                src={selectedProduct.imagePaths?.[0] || userPlaceholder}
                fluid
                alt={selectedProduct.name}
              />
              <h4 className="mt-3">{selectedProduct.name}</h4>
              <p>
                Người đăng:{" "}
                {userNames[selectedProduct.userId] || selectedProduct.userId}
              </p>
              <p>Danh mục: {selectedProduct.categoryName || "No Category"}</p>
              <p>
                Ngày đăng:{" "}
                {new Date(selectedProduct.createdAt).toLocaleString()}
              </p>
              <p>Mô tả: {selectedProduct.description}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
          {selectedProduct && (
            <Button
              variant="danger"
              onClick={(e) => handleDeleteProduct(selectedProduct.productId, e)}
            >
              Xóa sản phẩm
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManagePost;
