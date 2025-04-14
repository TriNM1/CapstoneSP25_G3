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
  const itemsPerPage = 10;

  // Mapping userId -> displayName
  const [userNames, setUserNames] = useState({});

  // Danh mục: lấy từ API /api/Products/categories, API trả về mảng chuỗi, ví dụ: ["Gau bong", "Xe oto"]
  const [categories, setCategories] = useState([]);

  // Modal chi tiết sản phẩm
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    const uniqueUserIds = Array.from(new Set(products.map(p => p.userId)))
      .filter(userId => !userNames[userId]);
    uniqueUserIds.forEach(async (userId) => {
      try {
        const res = await fetch(`https://localhost:7128/api/User/${userId}`);
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu người dùng");
        const data = await res.json();
        // Giả sử API trả về trường "displayName"
        setUserNames(prevState => ({ ...prevState, [userId]: data.displayName }));
      } catch (error) {
        console.error(error);
      }
    });
  }, [products, userNames]);

  // Fetch danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://localhost:7128/api/Products/categories");
        if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu danh mục");
        const data = await res.json();
        console.log("Categories data:", data);
        // Giả sử API trả về mảng chuỗi, ví dụ: ["Gau bong", "Xe oto"]
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  // Lọc các sản phẩm theo tên đồ chơi, tên người đăng và danh mục
  const filteredProducts = products.filter(product => {
    const toyName = product.name || "";
    const displayName = userNames[product.userId] || "";
    // Giả sử product.categoryId là 1-indexed, nên chuyển về 0-indexed dạng chuỗi
    const productCategoryIndex =
      product.categoryId !== undefined ? (Number(product.categoryId) - 1).toString() : "";
    
    const toyMatch = toyName.toLowerCase().includes(toySearch.toLowerCase());
    const userMatch = displayName.toLowerCase().includes(userSearch.toLowerCase());
    const categoryMatch = selectedCategory === "" || productCategoryIndex === selectedCategory;
    
    return toyMatch && userMatch && categoryMatch;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Mở modal hiển thị chi tiết sản phẩm
  const handleDetailClick = product => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  // Hàm xóa sản phẩm
  const handleDeleteProduct = async (productId, e) => {
    if(e) e.stopPropagation();
    if(!productId) {
      alert("Không tìm thấy ID sản phẩm.");
      return;
    }
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.");
    if(!confirmDelete) return;
    try {
      const res = await fetch(`https://localhost:7128/api/Products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "accept": "*/*"
        },
      });
      if(!res.ok) {
        if(res.status === 401) {
          alert("Bạn chưa đăng nhập hoặc không có quyền xóa sản phẩm.");
        } else {
          throw new Error("Lỗi khi xóa sản phẩm");
        }
        return;
      }
      setProducts(products.filter(p => p.productId !== productId));
      alert("Sản phẩm đã được xóa thành công.");
      setShowDetailModal(false);
    } catch(error) {
      console.error(error);
      alert("Xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau!");
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
                { id: 3, label: "Quản lý vi phạm", link: "/managepost" },
                { id: 4, label: "Thống kê", link: "/statistic" },
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
                    onChange={e => setToySearch(e.target.value)}
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
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Danh mục:</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {categories.map((catName, index) => (
                      <option key={index} value={index.toString()}>
                        {catName}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={12} className="mt-2">
                <Button variant="primary" onClick={() => setCurrentPage(1)}>
                  Lọc sản phẩm
                </Button>
              </Col>
            </Row>

            {/* Danh sách sản phẩm */}
            <Row className="post-item">
              {currentItems.map(product => (
                <Col md={4} key={product.productId} className="mb-3">
                  <div
                    className="product-card"
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={() => handleDetailClick(product)}
                  >
                    <Image
                      src={product.imagePaths?.[0] || userPlaceholder}
                      thumbnail
                      alt={product.name}
                    />
                    <h5 className="mt-2">{product.name}</h5>
                    <p>Người đăng: {userNames[product.userId] || product.userId}</p>
                    <p>
                      Danh mục:{" "}
                      {product.categoryId !== undefined && categories.length > 0
                        ? categories[Number(product.categoryId) - 1]
                        : "No Category"}
                    </p>
                    <p>
                      Ngày đăng: {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ position: "absolute", top: "10px", right: "10px" }}
                      onClick={e => handleDeleteProduct(product.productId, e)}
                    >
                      Xóa
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Phân trang */}
            <Pagination>
              {[...Array(totalPages).keys()].map(number => (
                <Pagination.Item
                  key={number + 1}
                  active={currentPage === number + 1}
                  onClick={() => paginate(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
            </Pagination>
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
                Người đăng: {userNames[selectedProduct.userId] || selectedProduct.userId}
              </p>
              <p>
                Danh mục:{" "}
                {selectedProduct.categoryId !== undefined && categories.length > 0
                  ? categories[Number(selectedProduct.categoryId) - 1]
                  : "No Category"}
              </p>
              <p>
                Ngày đăng: {new Date(selectedProduct.createdAt).toLocaleString()}
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
            <Button variant="danger" onClick={e => handleDeleteProduct(selectedProduct.productId, e)}>
              Xóa sản phẩm
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManagePost;
