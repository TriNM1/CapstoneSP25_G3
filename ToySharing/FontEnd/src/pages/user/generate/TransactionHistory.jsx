import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button } from "react-bootstrap";
import Header from "../../../components/Header";
import axios from "axios";
import Footer from "../../../components/footer";
import { useNavigate } from "react-router-dom";
import "./TransactionHistory.scss";

const TransactionHistory = ({ isLoggedIn, setActiveLink }) => {
  const navigate = useNavigate();
  const [currentUserId] = useState(
    localStorage.getItem("userId") || sessionStorage.getItem("userId")
  );
  const [transactions, setTransactions] = useState([]);

// // Kiểm tra quyền truy cập
//   useEffect(() => {
//     if (id !== currentUserId) {
//       alert("Bạn không có quyền truy cập!");
//       navigate("/home");
//     }
//   }, [id, currentUserId, navigate]);
  
  // Thêm interceptor cho axios
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Lấy lịch sử giao dịch
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("https://localhost:7128/api/Payments/successful");
        setTransactions(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử giao dịch:", error);
        alert("Không thể tải lịch sử giao dịch. Vui lòng thử lại!");
      }
    };

    if (currentUserId) fetchTransactions();
  }, [currentUserId]);

  return (
    <>
      <Header isLoggedIn={isLoggedIn} setActiveLink={setActiveLink} activeLink="transaction-history" />
      <Container className="mt-4">
        <Card className="p-4 shadow">
          <h3 className="text-center mb-4">Lịch Sử Giao Dịch Thành Công</h3>
          {transactions.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Mã Giao Dịch</th>
                  <th>Số Tiền</th>
                  <th>Ngày Giao Dịch</th>
                  <th>Mã Yêu Cầu</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transactionId}>
                    <td>{transaction.momoTransactionId}</td>
                    <td>{transaction.amount.toLocaleString("vi-VN")} VND</td>
                    <td>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td>
                    <td>{transaction.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center">Bạn chưa có giao dịch thành công nào.</p>
          )}
          <div className="text-center mt-4">
            <Button variant="primary" onClick={() => navigate("/sendingrequest")}>
              Quay lại Danh Sách Yêu Cầu
            </Button>
          </div>
        </Card>
        <Footer />
      </Container>
    </>
  );
};

export default TransactionHistory;