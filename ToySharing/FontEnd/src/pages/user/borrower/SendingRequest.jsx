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
import "react-datepicker/dist/react-datepicker.css";
import Header from "../../../components/Header";
import SideMenu from "../../../components/SideMenu";
import "./SendingRequest.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserInfor from "../generate/UserInfor";

const SendingRequest = () => {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("sending-request");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [requests, setRequests] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showPickedUpModal, setShowPickedUpModal] = useState(false);
  const [showPickedUpNonfeeModal, setShowPickedUpNonfeeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedToy, setSelectedToy] = useState(null);
  const [mainUserId, setMainUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userNames, setUserNames] = useState({});

  const API_BASE_URL = "https://localhost:7128/api";

  const sideMenuItems = [
    { id: 1, label: "Tìm kiếm đồ chơi", link: "/searchtoy" },
    { id: 2, label: "Danh sách mượn", link: "/sendingrequest" },
    { id: 3, label: "Lịch sử trao đổi", link: "/borrowhistory" },
  ];

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "0", label: "Đang chờ chấp nhận" },
    { value: "1", label: "Chấp nhận, chưa thanh toán" },
    { value: "2", label: "Chấp nhận, đã thanh toán" },
    { value: "8", label: "Chấp nhận, không mất phí" },
    { value: "3", label: "Đã lấy" },
  ];

  const getAuthToken = () => {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    const getMainUserId = () => {
      let userId = sessionStorage.getItem("userId");
      if (!userId) userId = localStorage.getItem("userId");
      if (userId) {
        setMainUserId(parseInt(userId));
      } else {
        navigate("/login");
      }
    };
    getMainUserId();
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem danh sách yêu cầu!");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Requests/toy-request`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedRequests = response.data.map((req) => ({
        requestId: req.requestId,
        productId: req.productId,
        productName: req.productName,
        ownerId: req.ownerId || null,
        ownerAvatar: req.ownerAvatar,
        borrowDate: req.borrowDate,
        returnDate: req.returnDate,
        requestDate: req.requestDate || new Date().toISOString(),
        message: req.message,
        status: req.status,
        image: req.image,
        depositAmount: req.depositAmount,
        rentalFee: req.rentalFee,
        displayName: req.name,
        confirmReturn: req.confirmReturn || 0,
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu cầu:", error);
      toast.error("Không thể tải danh sách yêu cầu!");
      setRequests([]);
    }
  };

  useEffect(() => {
    const uniqueOwnerIds = Array.from(
      new Set(requests.map((req) => req.ownerId).filter((id) => id && !userNames[id]))
    );
    uniqueOwnerIds.forEach(async (ownerId) => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/User/profile/${ownerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfo = response.data.userInfo || response.data;
        setUserNames((prev) => ({
          ...prev,
          [ownerId]: userInfo.displayName || "Không xác định",
        }));
      } catch (error) {
        console.error(`Lỗi khi lấy displayName cho user ${ownerId}:`, error);
        setUserNames((prev) => ({
          ...prev,
          [ownerId]: "Không xác định",
        }));
      }
    });
  }, [requests]);

  useEffect(() => {
    fetchRequests();
  }, [navigate, refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Function to fetch toy details and include request status
  const handleViewDetail = async (toyId, requestStatus, confirmReturn) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/Products/${toyId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedToy({
        productId: response.data.productId,
        image:
          response.data.imagePaths && response.data.imagePaths.length > 0
            ? response.data.imagePaths[0]
            : "https://via.placeholder.com/300x200?text=No+Image",
        name: response.data.name || "Không có tên",
        categoryName: response.data.categoryName || "Không có danh mục",
        productStatus:
          response.data.productStatus === 0
            ? "Mới"
            : response.data.productStatus === 1
              ? "Cũ"
              : "Không xác định",
        suitableAge: response.data.suitableAge || "Không xác định",
        price: parseFloat(response.data.price) || 0,
        description: response.data.description || "Không có mô tả",
        requestStatus: requestStatus, // Store request status
        confirmReturn: confirmReturn || 0, // Store confirmReturn
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đồ chơi:", error);
      toast.error("Không thể tải chi tiết đồ chơi!");
    }
  };

  // Sorting logic for requests
  const sortedRequests = requests
    .filter((request) => [0, 1, 2, 8, 3].includes(request.status) && (selectedStatus === "" || request.status.toString() === selectedStatus))
    .sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const aBorrowDate = new Date(a.borrowDate);
      const aReturnDate = new Date(a.returnDate);
      const bBorrowDate = new Date(b.borrowDate);
      const bReturnDate = new Date(b.returnDate);
      const aRequestDate = new Date(a.requestDate);
      const bRequestDate = new Date(b.requestDate);

      const aIsToday =
        aBorrowDate.toDateString() === today.toDateString() ||
        aReturnDate.toDateString() === today.toDateString();
      const bIsToday =
        bBorrowDate.toDateString() === today.toDateString() ||
        bReturnDate.toDateString() === today.toDateString();

      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      return bRequestDate - aRequestDate;
    });

  const handlePaymentClick = async (requestId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để thanh toán!");
        navigate("/login");
        return;
      }

      const request = requests.find((req) => req.requestId === requestId);
      if (!request) {
        toast.error("Không tìm thấy yêu cầu!");
        return;
      }

      const paymentData = {
        RequestId: request.requestId,
        Name: request.displayName,
        OrderInfo: `Thanh toán cho yêu cầu mượn đồ chơi số: ${request.requestId} - ${request.productName}`,
        DepositAmount: request.depositAmount,
        RentalFee: request.rentalFee,
      };

      const response = await axios.post(`${API_BASE_URL}/Payments/create`, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const { payUrl } = response.data;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        toast.error("Không thể tạo link thanh toán!");
      }
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      toast.error("Không thể tạo thanh toán!");
    }
  };

  const handleViewProfile = async (ownerId) => {
    if (!ownerId) {
      toast.error("Không có thông tin người cho mượn!");
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/User/profile/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userInfo = response.data.userInfo || response.data;
      setProfileData({ ...userInfo, userId: ownerId });
      setShowProfileModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người cho mượn:", error);
      toast.error("Không thể tải thông tin người cho mượn!");
    }
  };

  const handleMessage = async (ownerId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập để nhắn tin!");
        navigate("/login");
        return;
      }

      if (!ownerId || isNaN(ownerId)) {
        toast.error("ID người dùng không hợp lệ!");
        return;
      }

      if (ownerId === mainUserId) {
        toast.error("Bạn không thể nhắn tin cho chính mình!");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/Conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversations = response.data;
      const existingConversation = conversations.find(
        (convo) =>
          (convo.user1Id === ownerId && convo.user2Id === mainUserId) ||
          (convo.user2Id === ownerId && convo.user1Id === mainUserId)
      );

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.conversationId;
      } else {
        const createResponse = await axios.post(
          `${API_BASE_URL}/Conversations`,
          { user2Id: ownerId },
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
        toast.error(error.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện!");
      }
    }
  };

  const handleCancelClick = (id) => {
    setSelectedRequestId(id);
    setShowCancelModal(true);
  };

  const handlePickedUpClick = (id) => {
    setSelectedRequestId(id);
    setShowPickedUpModal(true);
  };
  const handlePickedUpNonfeeClick = (id) => {
    setSelectedRequestId(id);
    setShowPickedUpNonfeeModal(true);
  };

  const handleConfirmPickedUp = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/${selectedRequestId}/picked-up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === selectedRequestId ? { ...req, status: 3 } : req
        )
      );
      setRefreshTrigger((prev) => prev + 1);
      toast.success("Đã đánh dấu yêu cầu là đã lấy!");
      setShowPickedUpModal(false);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã lấy:", error);
      let errorMessage = "Không thể đánh dấu đã lấy!";
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

  const handleConfirmPickedUpNonfee = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/${selectedRequestId}/picked-up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === selectedRequestId ? { ...req, status: 3 } : req
        )
      );
      setRefreshTrigger((prev) => prev + 1);
      toast.success("Đã đánh dấu yêu cầu là đã lấy!");
      setShowPickedUpNonfeeModal(false);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã lấy:", error);
      let errorMessage = "Không thể đánh dấu đã lấy!";
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

  const handleConfirmReturn = async (requestId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/Requests/${requestId}/confirm-return`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) =>
        prev.map((req) =>
          req.requestId === requestId
            ? {
              ...req,
              confirmReturn: req.confirmReturn | 1,
              status: (req.confirmReturn | 1) === 3 ? 4 : req.status,
            }
            : req
        )
      );
      setRefreshTrigger((prev) => prev + 1);
      toast.success("Xác nhận trả thành công!");
    } catch (error) {
      console.error("Lỗi khi xác nhận trả:", error);
      let errorMessage = "Không thể xác nhận trả!";
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

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      toast.error("Vui lòng nhập lý do hủy yêu cầu!");
      return;
    }

    try {
      const token = getAuthToken();
      await axios.put(
        `${API_BASE_URL}/Requests/${selectedRequestId}/cancel`,
        { reason: cancelReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setRequests((prev) => prev.filter((req) => req.requestId !== selectedRequestId));
      toast.success("Hủy yêu cầu thành công!");
      setShowCancelModal(false);
      setSelectedRequestId(null);
      setCancelReason("");
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu:", error);
      toast.error("Không thể hủy yêu cầu!");
    }
  };

  const handleLoadMore = () => {
    toast.info("Đã hiển thị tất cả yêu cầu!");
  };

  return (
    <div className="sending-request-page home-page">
      <Header
        activeLink={activeLink}
        setActiveLink={setActiveLink}
        isLoggedIn={isLoggedIn}
        unreadMessages={3}
        notificationCount={2}
      />
      <Container fluid className="mt-4">
        <Row>
          <Col xs={12} md={2}>
            <SideMenu menuItems={sideMenuItems} activeItem={2} />
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
            <Row className="request-items-section">
              {sortedRequests.length === 0 ? (
                <Col xs={12} className="text-center">
                  <p>Không có yêu cầu mượn nào.</p>
                </Col>
              ) : (
                sortedRequests.map((request) => (
                  <Col key={request.requestId} xs={12} md={6} className="mb-4">
                    <Card className="request-card">
                      <div className="image-frame">
                        <Card.Img
                          variant="top"
                          src={request.image || "https://via.placeholder.com/300x200?text=No+Image"}
                          className="toy-image"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
                          onClick={() => handleViewDetail(request.productId, request.status, request.confirmReturn)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                      <Card.Body>
                        <Card.Title
                          className="toy-name"
                          onClick={() => handleViewDetail(request.productId, request.status, request.confirmReturn)}
                          style={{ cursor: "pointer" }}
                        >
                          {request.productName}
                        </Card.Title>
                        <Card.Text className="send-date">
                          <strong>Ngày gửi:</strong>{" "}
                          {request.requestDate
                            ? new Date(request.requestDate).toLocaleDateString()
                            : "Không xác định"}
                        </Card.Text>
                        <Card.Text className="borrow-date">
                          <strong>Ngày mượn:</strong>{" "}
                          {new Date(request.borrowDate).toLocaleDateString()}
                        </Card.Text>
                        <Card.Text className="return-date">
                          <strong>Ngày trả:</strong>{" "}
                          {new Date(request.returnDate).toLocaleDateString()}
                        </Card.Text>
                        <Card.Text className="status">
                          <strong>Trạng thái:</strong>{" "}
                          <span
                            className={
                              request.status === 0
                                ? "pending"
                                : request.status === 1
                                  ? "accepted"
                                  : request.status === 2
                                    ? "paid"
                                    : request.status === 8
                                      ? "nonfee"
                                      : request.status === 3
                                        ? "picked-up"
                                        : request.status === 4
                                          ? "completed"
                                          : ""
                            }
                          >
                            {request.status === 0
                              ? "Đang chờ chấp nhận"
                              : request.status === 1
                                ? "Chấp nhận, chưa thanh toán"
                                : request.status === 2
                                  ? "Chấp nhận, đã thanh toán"
                                  : request.status === 8
                                    ? "Chấp nhận, không mất phí"
                                    : request.status === 3
                                      ? (request.confirmReturn & 1) !== 0
                                        ? "Bạn đã xác nhận trả, chờ người cho mượn"
                                        : (request.confirmReturn & 2) !== 0
                                          ? "Chờ bạn xác nhận trả"
                                          : "Đã lấy, chưa xác nhận trả"
                                      : request.status === 4
                                        ? "Hoàn thành"
                                        : "Không xác định"}
                          </span>
                        </Card.Text>
                        
                        <div className="lender-info d-flex align-items-center mb-2">
                          <img
                            src={request.ownerAvatar || "https://via.placeholder.com/50?text=Avatar"}
                            alt="Ảnh đại diện người cho mượn"
                            className="lender-avatar"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/50?text=Avatar")}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(request.ownerId);
                            }}
                            style={{ cursor: "pointer" }}
                          />
                          <Button
                            variant="link"
                            className="lender-link p-0 text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(request.ownerId);
                            }}
                          >
                              Thông tin người cho mượn
                              </Button>
                        </div>
                        <div className="request-actions text-center">
                          {request.status === 0 && (
                            <Button
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClick(request.requestId);
                              }}
                              className="action-btn"
                            >
                              Hủy yêu cầu
                            </Button>
                          )}
                          {request.status === 1 && (
                            <>
                              <Button
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentClick(request.requestId);
                                }}
                                className="action-btn"
                              >
                                Thanh Toán
                              </Button>
                              <Button
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(request.requestId);
                                }}
                                className="action-btn"
                              >
                                Hủy
                              </Button>
                            </>
                          )}
                          {(request.status === 2) && (
                            <>
                              <Button
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePickedUpClick(request.requestId);
                                }}
                                className="action-btn"
                                disabled={request.status === 3}
                              >
                                Đã lấy
                              </Button>
                              <Button
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(request.requestId);
                                }}
                                className="action-btn"
                              >
                                Hủy
                              </Button>
                            </>
                          )}
                          {(request.status === 8) && (
                            <>
                              <Button
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePickedUpNonfeeClick(request.requestId);
                                }}
                                className="action-btn"
                                disabled={request.status === 3}
                              >
                                Đã lấy
                              </Button>
                              <Button
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(request.requestId);
                                }}
                                className="action-btn"
                              >
                                Hủy
                              </Button>
                            </>
                          )}
                          {request.status === 3 && (
                            <Button
                              variant="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmReturn(request.requestId);
                              }}
                              className="action-btn"
                              disabled={(request.confirmReturn & 1) !== 0}
                            >
                              {(request.confirmReturn & 1) !== 0 ? "Đã xác nhận trả" : "Xác nhận trả"}
                            </Button>

                          )}
                        </div>
                        <Card.Text className="status-hint">
                          {request.status === 0
                            ? "Vui lòng chờ người cho mượn xác nhận yêu cầu của bạn."
                            : request.status === 1
                              ? "Vui lòng thanh toán để tiếp tục quá trình mượn."
                              : request.status === 2
                                ? "Hãy đến lấy đồ chơi đúng ngày và bấm 'Đã lấy' để cập nhật trạng thái."
                                : request.status === 3
                                  ? (request.confirmReturn & 1) !== 0
                                    ? "Đã xác nhận trả, đang chờ người cho mượn xác nhận."
                                    : (request.confirmReturn & 2) !== 0
                                      ? "Vui lòng xác nhận trả để hoàn tất quá trình mượn."
                                      : "Xác nhận trả khi bạn đã hoàn trả đồ chơi."
                                  : request.status === 4
                                    ? "Yêu cầu đã hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ!"
                                    : "Trạng thái không xác định, vui lòng liên hệ hỗ trợ."}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
            {sortedRequests.length > 0 && (
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
          </Col>
        </Row>
      </Container>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy yêu cầu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn hủy yêu cầu này không?</p>
          <Form.Group controlId="cancelReason">
            <Form.Label>Lý do hủy</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Nhập lý do hủy yêu cầu"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmCancel}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPickedUpModal}
        onHide={() => setShowPickedUpModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đã lấy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn đã lấy đồ chơi này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPickedUpModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmPickedUp}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPickedUpNonfeeModal}
        onHide={() => setShowPickedUpNonfeeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận đã lấy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn đã lấy đồ chơi này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPickedUpNonfeeModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmPickedUpNonfee}>
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
          <Modal.Title>Thông tin người cho mượn</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileData ? (
            <div>
              <img
                src={profileData.avatar || "https://via.placeholder.com/100?text=Avatar"}
                alt="Ảnh đại diện"
                className="rounded-circle mb-3"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=Avatar")}
              />
              <p><strong>Tên hiển thị:</strong> {profileData.displayName || "Không có tên"}</p>
              <p><strong>Tuổi:</strong> {profileData.age || "Không có thông tin"}</p>
              <p><strong>Địa chỉ:</strong> {profileData.address || "Không có thông tin"}</p>
              <p><strong>Đánh giá:</strong> {profileData.rating ? profileData.rating.toFixed(2) : "Chưa có đánh giá"}</p>
            </div>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => handleMessage(profileData?.userId)}
            disabled={!profileData || !isLoggedIn || !profileData?.userId || profileData?.userId === mainUserId}
          >
            Nhắn tin
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đồ chơi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedToy ? (
            <>
              <div className="image-frame">
                <img
                  src={selectedToy.image}
                  alt={selectedToy.name}
                  className="detail-image"
                  style={{ width: "100%", height: "auto", objectFit: "cover" }}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=No+Image")}
                />
              </div>
              <h5 className="mt-3">{selectedToy.name}</h5>
              <p><strong>Danh mục:</strong> {selectedToy.categoryName || "Không có"}</p>
              <p><strong>Tình trạng:</strong> {selectedToy.productStatus || "Không có"}</p>
              <p><strong>Độ tuổi phù hợp:</strong> {selectedToy.suitableAge || "Không có"}</p>
              <p><strong>Phí cho mượn:</strong> {selectedToy.price.toLocaleString("vi-VN")} VND</p>
              <p><strong>Mô tả:</strong> {selectedToy.description || "Không có"}</p>
              <p>
                <strong>Trạng thái yêu cầu:</strong>{" "}
                <span
                  className={
                    selectedToy.requestStatus === 0
                      ? "pending"
                      : selectedToy.requestStatus === 1
                        ? "accepted"
                        : selectedToy.requestStatus === 2
                          ? "paid"
                          : selectedToy.requestStatus === 8
                            ? "nonfee"
                            : selectedToy.requestStatus === 3
                              ? "picked-up"
                              : selectedToy.requestStatus === 4
                                ? "completed"
                                : ""
                  }
                >
                  {selectedToy.requestStatus === 0
                    ? "Đang chờ chấp nhận"
                    : selectedToy.requestStatus === 1
                      ? "Chấp nhận, chưa thanh toán"
                      : selectedToy.requestStatus === 2
                        ? "Chấp nhận, đã thanh toán"
                        : selectedToy.requestStatus === 8
                          ? "Chấp nhận, không mất phí"
                          : selectedToy.requestStatus === 3
                            ? (selectedToy.confirmReturn & 1) !== 0
                              ? "Bạn đã xác nhận trả, chờ người cho mượn"
                              : (selectedToy.confirmReturn & 2) !== 0
                                ? "Chờ bạn xác nhận trả"
                                : "Đã lấy, chưa xác nhận trả"
                            : selectedToy.requestStatus === 4
                              ? "Hoàn thành"
                              : "Không xác định"}
                </span>
              </p>
            </>
          ) : (
            <p>Đang tải thông tin...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="action-btn"
            onClick={() => setShowDetailModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SendingRequest;