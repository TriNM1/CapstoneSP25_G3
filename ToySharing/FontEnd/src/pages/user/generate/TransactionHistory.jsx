import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button, Pagination } from "react-bootstrap";
import Header from "../../../components/Header";
import axios from "axios";
import Footer from "../../../components/footer";
import { useNavigate } from "react-router-dom";
import "./TransactionHistory.scss";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [currentUserId] = useState(
    localStorage.getItem("userId") || sessionStorage.getItem("userId")
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"))
  );
  const [transactions, setTransactions] = useState([]);
  const [activeLink, setActiveLink] = useState("transaction-history");
  const [unreadMessages] = useState(0); 
  const [notificationCount] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 8;

  const transactionTypeMap = {
    0: "Chuyển tiền mượn đồ chơi",
    1: "Hoàn tiền cọc",
    2: "Chuyển phí mượn",
    3: "Chuyển tiền phạt",
  };

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

    if (currentUserId && isLoggedIn) {
      fetchTransactions();
    } else {
      navigate("/login");
    }
  }, [currentUserId, isLoggedIn, navigate]);

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        setActiveLink={setActiveLink}
        activeLink={activeLink}
        unreadMessages={unreadMessages}
        notificationCount={notificationCount}
      />
      <Container className="mt-5">
        <Card className="p-4 shadow">
          <h3 className="text-center mb-4">Lịch Sử Giao Dịch Thành Công</h3>
          {transactions.length > 0 ? (
            <>
              <Table striped bordered hover responsive className="text-center">
                <thead>
                  <tr>
                    <th>Mã Giao Dịch</th>
                    <th>Mã Yêu Cầu</th>
                    <th>Loại Giao Dịch</th>
                    <th>Số Tiền</th>
                    <th>Ngày Giao Dịch</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction.transactionId}>
                      <td>{transaction.momoTransactionId}</td>
                      <td>{transaction.requestId}</td>
                      <td>{transactionTypeMap[transaction.transactionType] || "Không xác định"}</td>
                      <td>{transaction.amount.toLocaleString("vi-VN")} VND</td>
                      <td>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="pagination-container mt-4">
                <Pagination className="justify-content-center">
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {Array.from({ length: totalPages }, (_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === currentPage}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          ) : (
            <p className="text-center">Bạn chưa có giao dịch thành công nào.</p>
          )}
          <div className="text-center mt-4">
            <Button variant="primary" onClick={() => navigate("/Home")}>
              Quay lại trang chủ
            </Button>
          </div>
        </Card>
        <Footer />
      </Container>
    </>
  );
};

export default TransactionHistory;