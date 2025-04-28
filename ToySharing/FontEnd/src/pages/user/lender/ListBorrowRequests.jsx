import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ListBorrowRequests.scss";
import Footer from "../../../components/footer";

const ListBorrowRequests = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("muon-do-choi");
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [visibleItems, setVisibleItems] = useState(4);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [otherRequestsCount, setOtherRequestsCount] = useState(0); // Số yêu cầu khác cho cùng sản phẩm
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userNames, setUserNames] = useState({}); // Store displayName for requesters

  const API_BASE_URL = "https://localhost:7128/api";

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "0", label: "Đang chờ xử lý" },
  ];

  const sideMenuItems = [
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  const fetchRequests = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem danh sách yêu cầu mượn!");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Requests/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedRequests = response.data
        .map((req) => ({
          id: req.requestId,
          productId: req.productId, // Thêm productId để lọc yêu cầu
          image: req.image || "https://via.placeholder.com/300x200?text=No+Image",
          name: req.productName,
          price: `${req.price.toLocaleString("vi-VN")} VND`,
          requestDate: new Date(req.requestDate).toISOString().split("T")[0],
          borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
          returnDate: new Date(req.returnDate).toISOString().split("T")[0],
          requesterId: req.userId,
          requesterAvatar: req.borrowerAvatar || "https://via.placeholder.com/50?text=Avatar",
          message: req.message,
          status: 0, // Pending status
        }))
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu yêu cầu mượn:", error);
      toast.error("Không thể tải dữ liệu từ API!");
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();

    const timer = setTimeout(() => {
      fetchRequests();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Fetch displayName for requesters
  useEffect(() => {
    const uniqueRequesterIds = Array.from(
      new Set(
        requests
          .map((r) => r.requesterId)
          .filter((id) => id && !userNames[id])
      )
    );
    uniqueRequesterIds.forEach(async (requesterId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${requesterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [requesterId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${requesterId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [requesterId]: "Không xác định",
        }));
      }
    });
  }, [requests]);

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const handleViewMessage = (message) => {
    setModalMessage(message || "");
    setShowMessageModal(true);
  };

  const handleConfirmAction = (action, id) => {
    setConfirmAction(action);
    setSelectedRequestId(id);
    // Đếm số yêu cầu khác có cùng productId
    const selectedRequest = requests.find((req) => req.id === id);
    if (selectedRequest && action === "accept") {
      const otherRequests = requests.filter(
        (req) => req.productId === selectedRequest.productId && req.id !== id
      );
      setOtherRequestsCount(otherRequests.length);
    } else {
      setOtherRequestsCount(0);
    }
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xử lý yêu cầu!");
        return;
      }

      // Tìm yêu cầu được chọn
      const selectedRequest = requests.find((req) => req.id === selectedRequestId);
      if (!selectedRequest) {
        toast.error("Yêu cầu không tồn tại!");
        return;
      }

      if (confirmAction === "accept") {
        // Chấp nhận yêu cầu được chọn
        await axios.put(
          `${API_BASE_URL}/Requests/${selectedRequestId}/status`,
          { newStatus: 1 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Tìm và từ chối tất cả các yêu cầu khác có cùng productId
        const otherRequests = requests.filter(
          (req) => req.productId === selectedRequest.productId && req.id !== selectedRequestId
        );

        for (const req of otherRequests) {
          try {
            await axios.put(
              `${API_BASE_URL}/Requests/${req.id}/status`,
              { newStatus: 5 },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (error) {
            console.error(`Lỗi khi từ chối yêu cầu ${req.id}:`, error);
            // Tiếp tục với các yêu cầu khác ngay cả khi một yêu cầu thất bại
          }
        }

        // Xóa tất cả các yêu cầu liên quan đến productId khỏi danh sách
        setRequests((prev) =>
          prev.filter((req) => req.productId !== selectedRequest.productId)
        );
        toast.success("Chấp nhận yêu cầu thành công! Các yêu cầu khác đã bị từ chối.");
      } else if (confirmAction === "decline") {
        // Từ chối yêu cầu được chọn
        await axios.put(
          `${API_BASE_URL}/Requests/${selectedRequestId}/status`,
          { newStatus: 5 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setRequests((prev) =>
          prev.filter((request) => request.id !== selectedRequestId)
        );
        toast.success("Từ chối yêu cầu thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý yêu cầu:", error);
      toast.error("Có lỗi xảy ra khi xử lý yêu cầu!");
      // Xóa yêu cầu khỏi giao diện để tránh hiển thị yêu cầu không hợp lệ
      setRequests((prev) =>
        prev.filter((request) => request.id !== selectedRequestId)
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction("");
      setSelectedRequestId(null);
      setOtherRequestsCount(0);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/User/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người mượn:", error);
      toast.error("Không thể tải thông tin người mượn!");
    }
  };

  const filteredRequests = requests.filter(
    (item) => selectedStatus === "" || item.status.toString() === selectedStatus
  );
  const visibleRequests = filteredRequests.slice(0, visibleItems);

  return (
    <div className="list-borrow-requests-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={3}
        notificationCount={2}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={4} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            {filteredRequests.length === 0 ? (
              <div className="text-center mt-5">
                <p className="no-results">Không có yêu cầu mượn nào.</p>
              </div>
            ) : (
              <>
                <Row className="lending-items-section">
                  {visibleRequests.map((request) => (
                    <Col key={request.id} xs={12} md={6} className="mb-4">
                      <Card className="borrow-request-card">
                        <div className="image-frame">
                          <Card.Img
                            variant="top"
                            src={request.image}
                            className="toy-image"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                        </div>
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{request.name}</Card.Title>
                          <Card.Text className="toy-price">{request.price}</Card.Text>
                          <Card.Text className="request-date">
                            <strong>Ngày gửi yêu cầu:</strong> {request.requestDate}
                          </Card.Text>
                          <Card.Text className="borrow-date">
                            <strong>Ngày mượn:</strong> {request.borrowDate}
                          </Card.Text>
                          <Card.Text className="return-date">
                            <strong>Ngày trả:</strong> {request.returnDate}
                          </Card.Text>
                          <div className="lender-info d-flex align-items-center mb-2">
                            <img
                              src={request.requesterAvatar}
                              alt="Ảnh đại diện người mượn"
                              className="requester-avatar"
                              onError={(e) =>
                                (e.target.src = "https://via.placeholder.com/50?text=Avatar")
                              }
                              onClick={() => handleViewProfile(request.requesterId)}
                              style={{ cursor: "pointer" }}
                            />
                            <Button
                              variant="link"
                              className="requester-link p-0 text-decoration-none"
                              onClick={() => handleViewProfile(request.requesterId)}
                            >
                              Thông tin người mượn
                            </Button>
                          </div>
                          <div className="card-actions">
                            <div className="d-flex justify-content-center mb-3">
                              <Button
                                variant="secondary"
                                className="action-btn"
                                onClick={() => handleViewMessage(request.message)}
                              >
                                Xem lời nhắn
                              </Button>
                            </div>
                            <div className="d-flex justify-content-center gap-3">
                              <Button
                                variant="success"
                                className="action-btn"
                                onClick={() => handleConfirmAction("accept", request.id)}
                              >
                                Chấp nhận
                              </Button>
                              <Button
                                variant="danger"
                                className="action-btn"
                                onClick={() => handleConfirmAction("decline", request.id)}
                              >
                                Từ chối
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleRequests.length < filteredRequests.length && (
                  <div className="text-center">
                    <Button
                      variant="outline-primary"
                      className="view-more-btn"
                      onClick={handleLoadMore}
                    >
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
        <Footer />
      </Container>

      <Modal
        show={showMessageModal}
        onHide={() => setShowMessageModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Lời nhắn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalMessage ? (
            <p>{modalMessage}</p>
          ) : (
            <p style={{ opacity: 0.5, color: "#666" }}>Không có lời nhắn</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMessageModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmAction === "accept"
            ? otherRequestsCount > 0
              ? "Bạn có chắc chắn muốn chấp nhận yêu cầu mượn này? Các yêu cầu khác cho sản phẩm này sẽ bị từ chối."
              : "Bạn có chắc chắn muốn chấp nhận yêu cầu mượn này?"
            : "Bạn có chắc chắn muốn từ chối yêu cầu mượn này?"}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thông tin người mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={
                  profileData.avatar ||
                  "https://via.placeholder.com/100?text=Avatar"
                }
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(e) =>
                  (e.target.src = "https://via.placeholder.com/100?text=Avatar")
                }
              />
              <p>
                <strong>Tên hiển thị:</strong>{" "}
                {profileData.displayName || "Không có tên"}
              </p>
              <p>
                <strong>Tuổi:</strong> {profileData.age || "Không có thông tin"}
              </p>
              <p>
                <strong>Địa chỉ:</strong>{" "}
                {profileData.address || "Không có thông tin"}
              </p>
              <p>
                <strong>Đánh giá:</strong>{" "}
                {profileData.rating
                  ? profileData.rating.toFixed(2)
                  : "Chưa có đánh giá"}
              </p>
            </div>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProfileModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ListBorrowRequests;