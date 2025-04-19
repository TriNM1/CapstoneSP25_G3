import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentError = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse the error message from query parameters
  const queryParams = new URLSearchParams(location.search);
  let errorMessage = queryParams.get("message") || "Đã có lỗi xảy ra trong quá trình thanh toán";

  // Override misleading "Success" message
  if (errorMessage.toLowerCase() === "success") {
    errorMessage = "Giao dịch không thành công do lỗi xử lý. Vui lòng thử lại.";
  }

  const handleRetry = () => {
    navigate("/sendingrequest");
  };

  return (
    <div className="payment-error-page">
      <Container className="mt-5">
        <Card className="text-center">
          <Card.Body>
            <Card.Title className="text-danger">Thanh Toán Thất Bại</Card.Title>
            <Card.Text>{errorMessage}</Card.Text>
            <Button variant="primary" onClick={handleRetry}>
              Thử lại
            </Button>
          </Card.Body>
        </Card>
      </Container>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PaymentError;