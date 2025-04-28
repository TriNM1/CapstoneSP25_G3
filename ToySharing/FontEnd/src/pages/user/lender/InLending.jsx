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
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "./InLending.scss";

const InLending = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("lending");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [lendings, setLendings] = useState([]);
  const [visibleItems, setVisibleItems] = useState(4);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userNames, setUserNames] = useState({}); // Store displayName for borrowers

  const sideMenuItems = [
    { id: 2, label: "Danh sách đồ chơi của tôi", link: "/mytoy" },
    { id: 3, label: "Đang cho mượn", link: "/inlending" },
    { id: 4, label: "Danh sách yêu cầu mượn", link: "/listborrowrequests" },
    { id: 5, label: "Lịch sử trao đổi", link: "/transferhistory" },
  ];

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "1", label: "Đã chấp nhận" },
    { value: "2", label: "Người dùng đã thanh toán" },
    { value: "3", label: "Chờ xác nhận trả" },
  ];

  const API_BASE_URL = "https://localhost:7128/api";

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  const fetchLendings = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/Requests/borrowing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const filteredLendings = response.data
        .filter((req) => [1, 2, 3].includes(req.status))
        .map((req) => ({
          id: req.requestId,
          image: req.image || "https://via.placeholder.com/300x200?text=No+Image",
          name: req.productName,
          price: req.price || 0, // Phí mượn
          depositAmount: req.depositAmount || 0, // Giá trị đồ chơi (cọc)
          borrowDate: new Date(req.rentDate).toISOString().split("T")[0],
          returnDate: new Date(req.returnDate).toISOString().split("T")[0],
          lenderId: req.userId,
          lenderAvatar: req.borrowerAvatar || "https://via.placeholder.com/50?text=Avatar",
          status: req.status,
          confirmReturn: req.confirmReturn || 0,
        }))
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
      setLendings(filteredLendings);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đồ chơi đang cho mượn:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error(
          "Không thể tải dữ liệu từ API! " +
          (error.response?.data?.message || error.message)
        );
      }
      setLendings([]);
    }
  };

  useEffect(() => {
    fetchLendings();
  }, [navigate, refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch displayName for borrowers
  useEffect(() => {
    const uniqueLenderIds = Array.from(
      new Set(lendings.map((l) => l.lenderId).filter((id) => id && !userNames[id]))
    );
    uniqueLenderIds.forEach(async (lenderId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${lenderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [lenderId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${lenderId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [lenderId]: "Không xác định",
        }));
      }
    });
  }, [lendings]);

  const handleMessage = async (lenderId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversations = response.data;
      const userId = parseInt(
        localStorage.getItem("userId") || sessionStorage.getItem("userId")
      );
      const existingConversation = conversations.find(
        (convo) =>
          (convo.user1Id === lenderId && convo.user2Id === userId) ||
          (convo.user2Id === lenderId && convo.user1Id === userId)
      );

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.conversationId;
      } else {
        const createResponse = await axios.post(
          `${API_BASE_URL}/Conversations`,
          { user2Id: lenderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        conversationId = createResponse.data.conversationId;
      }

      navigate("/message", { state: { activeConversationId: conversationId } });
    } catch (error) {
      console.error("Lỗi khi xử lý nhắn tin:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện!"
        );
      }
    }
  };

  const handleViewProfile = async (lenderId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/User/profile/${lenderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId: lenderId });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người mượn:", error);
      toast.error("Không thể tải thông tin người mượn!");
    }
  };

  const handleConfirmReturn = async (requestId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/Requests/${requestId}/confirm-return`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setLendings((prev) => {
        const newLendings = prev.map((item) =>
          item.id === requestId
            ? {
              ...item,
              confirmReturn: item.confirmReturn | 2,
              status: (item.confirmReturn | 2) === 3 ? 4 : item.status,
            }
            : item
        );
        return newLendings;
      });

      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 500);

      toast.success("Xác nhận trả thành công!");
    } catch (error) {
      console.error("Lỗi khi xác nhận trả:", error);
      let errorMessage = "Không thể xác nhận trả!";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (
          error.response.status === 400 &&
          errorMessage.includes("Bạn đã xác nhận trả trước đó")
        ) {
          setLendings((prev) =>
            prev.map((item) =>
              item.id === requestId
                ? {
                  ...item,
                  confirmReturn: item.confirmReturn | 2,
                }
                : item
            )
          );
          toast.info("Yêu cầu đã được xác nhận trước đó!");
        } else if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
          navigate("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (error.response.status === 404) {
          errorMessage = "Yêu cầu không tồn tại!";
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleMarkNotReturned = async (requestId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/${requestId}/mark-not-returned`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setLendings((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
              ...item,
              status: 7,
              confirmReturn: item.confirmReturn,
            }
            : item
        )
      );
      setRefreshTrigger((prev) => prev + 1);
      toast.success("Đã đánh dấu yêu cầu là chưa trả!");
    } catch (error) {
      console.error("Lỗi khi đánh dấu chưa trả:", error);
      let errorMessage = "Không thể đánh dấu yêu cầu là chưa trả!";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
          navigate("/login");
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (error.response.status === 404) {
          errorMessage = "Yêu cầu không tồn tại!";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Yêu cầu không hợp lệ!";
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleLoadMore = () => {
    setVisibleItems((prev) => prev + 3);
  };

  const isOverdue = (returnDate, confirmReturn) => {
    const currentDate = new Date();
    const parsedReturnDate = new Date(returnDate);
    const daysOverdue = (currentDate - parsedReturnDate) / (1000 * 60 * 60 * 24);
    return daysOverdue > 3 && (confirmReturn & 1) === 0;
  };

  const getStatusLabel = (item) => {
    if ((item.status === 1 || item.status === 2) && item.price === 0 && item.depositAmount === 0) {
      return "Chờ người mượn lấy đồ";
    }
    if (item.status === 1) {
      return "Đã chấp nhận";
    }
    if (item.status === 2) {
      return "Người dùng đã thanh toán";
    }
    if (item.status === 3) {
      if ((item.confirmReturn & 2) !== 0)
        return "Bạn đã xác nhận trả, chờ người mượn";
      if ((item.confirmReturn & 1) !== 0) return "Chờ bạn xác nhận trả";
      return isOverdue(item.returnDate, item.confirmReturn)
        ? "Quá hạn, chưa trả"
        : "Đã lấy, chưa xác nhận trả";
    }
    return "Không xác định";
  };

  const getActionHint = (item) => {
    if ((item.status === 1 || item.status === 2) && item.price === 0 && item.depositAmount === 0) {
      return "Nhắn tin và chờ người mượn lấy đồ chơi";
    }
    if (item.status === 1) {
      return "Nhắn tin và chờ người mượn thanh toán";
    }
    if (item.status === 2) {
      return "Nhắn tin và chờ người mượn lấy đồ chơi";
    }
    if (item.status === 3) {
      if ((item.confirmReturn & 2) !== 0) {
        return "Chờ người mượn xác nhận trả";
      }
      if ((item.confirmReturn & 1) !== 0) {
        return "Xác nhận trả đồ chơi";
      }
      return isOverdue(item.returnDate, item.confirmReturn)
        ? "Xác nhận trả hoặc đánh dấu chưa trả"
        : "Xác nhận trả đồ chơi khi người mượn trả";
    }
    return "";
  };

  const filteredLendings = lendings.filter(
    (item) =>
      selectedStatus === "" || item.status.toString() === selectedStatus
  );
  const visibleLendings = filteredLendings.slice(0, visibleItems);

  return (
    <div className="inlending-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={true}
        unreadMessages={0}
        notificationCount={0}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={3} />
          </Col>
          <Col xs={12} md={10} className="main-content">
            <Row className="filter-section mb-3">
              <Col md={3}></Col>
              <Col md={6}>
                <Form.Group controlId="selectStatus">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            {filteredLendings.length === 0 ? (
              <div className="text-center mt-5">
                <p className="no-results">
                  Không có đồ chơi nào trong trạng thái đang cho mượn.
                </p>
              </div>
            ) : (
              <>
                <Row className="lending-items-section">
                  {visibleLendings.map((item) => (
                    <Col key={item.id} xs={12} md={6} className="mb-4">
                      <Card className="toy-card" data-tooltip={getActionHint(item)}>
                        <div className="image-frame">
                          <Card.Img
                            variant="top"
                            src={item.image}
                            className="toy-image"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")
                            }
                          />
                        </div>
                        <Card.Body className="card-body">
                          <Card.Title className="toy-name">{item.name}</Card.Title>
                          <Card.Text className="borrow-date">
                            <strong>Ngày mượn:</strong> {item.borrowDate}
                          </Card.Text>
                          <Card.Text className="return-date">
                            <strong>Ngày trả:</strong> {item.returnDate}
                          </Card.Text>
                          <Card.Text className="lending-status">
                            <strong>Trạng thái:</strong>{" "}
                            <span
                              className={
                                item.status === 7
                                  ? "not-returned"
                                  : item.status === 4
                                    ? "completed"
                                    : "in-progress"
                              }
                            >
                              {getStatusLabel(item)}
                            </span>
                          </Card.Text>
                          <div className="lender-info d-flex align-items-center mb-2">
                            <img
                              src={item.lenderAvatar}
                              alt="Ảnh đại diện người mượn"
                              className="lender-avatar"
                              onError={(e) =>
                                (e.target.src = "https://via.placeholder.com/50?text=Avatar")
                              }
                              onClick={() => handleViewProfile(item.lenderId)}
                              style={{ cursor: "pointer" }}
                            />
                            <Button
                              variant="link"
                              className="lender-link p-0 text-decoration-none"
                              onClick={() => handleViewProfile(item.lenderId)}
                            >
                              Thông tin người mượn
                            </Button>
                          </div>
                          <div className="card-actions">
                            <Button
                              variant="primary"
                              className="action-btn btn-message"
                              onClick={() => handleMessage(item.lenderId)}
                            >
                              Nhắn tin
                            </Button>
                            {item.status === 3 && (
                              <>
                                <Button
                                  variant="success"
                                  className="action-btn"
                                  onClick={() => handleConfirmReturn(item.id)}
                                  disabled={(item.confirmReturn & 2) !== 0}
                                >
                                  {(item.confirmReturn & 2) !== 0
                                    ? "Đã xác nhận trả"
                                    : "Xác nhận trả"}
                                </Button>
                                {isOverdue(item.returnDate, item.confirmReturn) && (
                                  <Button
                                    variant="danger"
                                    className="action-btn"
                                    onClick={() => handleMarkNotReturned(item.id)}
                                    disabled={item.status === 7}
                                  >
                                    {item.status === 7
                                      ? "Đã đánh dấu chưa trả"
                                      : "Đánh dấu chưa trả"}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                          <Card.Text className="action-hint">
                            {getActionHint(item)}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {visibleLendings.length < filteredLendings.length && (
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
      </Container>

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

export default InLending;