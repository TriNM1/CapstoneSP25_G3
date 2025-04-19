import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
// import Header from "../components/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PaymentSuccess.scss"; 

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters from the URL
  const queryParams = new URLSearchParams(location.search);
  const displayName = queryParams.get("displayName") || "Người dùng";
  const orderId = queryParams.get("orderId") || "N/A";
  const amount = parseFloat(queryParams.get("amount")) || 0;
  const orderInfo = queryParams.get("orderInfo") || "Thanh toán mượn đồ chơi";

  const handleConfirm = () => {
    navigate("/sendingrequest");
  };

  return (
    <div className="payment-success-page">
      {/* <Header
        activeLink="sending-request"
        isLoggedIn={true} 
        unreadMessages={3}
        notificationCount={2}
      /> */}
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title className="text-success">Thanh Toán Thành Công!</Card.Title>
            <Card.Text>
              Cảm ơn bạn đã hoàn tất thanh toán. Dưới đây là chi tiết giao dịch:
            </Card.Text>
            <div className="payment-details">
              <p>
                <strong>Tên người dùng:</strong> {displayName}
              </p>
              <p>
                <strong>Mã giao dịch:</strong> {orderId}
              </p>
              <p>
                <strong>Số tiền:</strong> {amount.toLocaleString("vi-VN")} VND
              </p>
              <p>
                <strong>Nội dung thanh toán:</strong> {orderInfo}
              </p>
            </div>
            <Button variant="primary" onClick={handleConfirm}>
              Xác nhận và Quay lại
            </Button>
          </Card.Body>
        </Card>
      </Container>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PaymentSuccess;