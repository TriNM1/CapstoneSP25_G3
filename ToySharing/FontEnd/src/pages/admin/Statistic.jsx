// eslint-disable-next-line no-unused-vars
import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import AdminSideMenu from "../../components/AdminSideMenu";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Statistic.scss";

const Statistic = () => {
  // Dữ liệu giả cho biểu đồ
  const monthlyUsers = [
    { month: "Tháng 1", users: 120 },
    { month: "Tháng 2", users: 150 },
    { month: "Tháng 3", users: 180 },
    { month: "Tháng 4", users: 200 },
    { month: "Tháng 5", users: 250 },
    { month: "Tháng 6", users: 300 },
  ];

  const monthlyPosts = [
    { month: "Tháng 1", posts: 80 },
    { month: "Tháng 2", posts: 100 },
    { month: "Tháng 3", posts: 120 },
    { month: "Tháng 4", posts: 150 },
    { month: "Tháng 5", posts: 170 },
    { month: "Tháng 6", posts: 190 },
  ];

  const topPosters = [
    { name: "Nguyễn Văn A", posts: 45 },
    { name: "Trần Thị B", posts: 40 },
    { name: "Lê Văn C", posts: 35 },
    { name: "Phạm Thị D", posts: 30 },
  ];

  const topRentedProducts = [
    { product: "Sản phẩm A", rents: 60 },
    { product: "Sản phẩm B", rents: 55 },
    { product: "Sản phẩm C", rents: 50 },
    { product: "Sản phẩm D", rents: 45 },
  ];

  // Màu sắc cho biểu đồ Pie
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="statistic admin-page">
      <Container fluid className="mt-4">
        <Row>
          {/* Side menu dùng chung */}
          <Col xs={12} md={2}>
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

          {/* Nội dung chính */}
          <Col xs={12} md={10} className="main-content">
            <div className="statistic-content">
              <h1>Thống kê</h1>
              <div className="charts-container">
                {/* Biểu đồ đường: Lượng người dùng hàng tháng */}
                <Card className="chart-card">
                  <Card.Body>
                    <Card.Title>Lượng người dùng hàng tháng</Card.Title>
                    <LineChart width={600} height={300} data={monthlyUsers}>
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#ff6f61"
                        strokeWidth={2}
                      />
                      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                    </LineChart>
                  </Card.Body>
                </Card>

                {/* Biểu đồ cột: Lượng bài đăng hàng tháng */}
                <Card className="chart-card">
                  <Card.Body>
                    <Card.Title>Lượng bài đăng hàng tháng</Card.Title>
                    <BarChart width={600} height={300} data={monthlyPosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="posts" fill="#8884d8" />
                    </BarChart>
                  </Card.Body>
                </Card>

                {/* Biểu đồ cột: Những người đăng bài nhiều nhất */}
                <Card className="chart-card">
                  <Card.Body>
                    <Card.Title>Những người đăng bài nhiều nhất</Card.Title>
                    <BarChart width={600} height={300} data={topPosters}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="posts" fill="#82ca9d" />
                    </BarChart>
                  </Card.Body>
                </Card>

                {/* Biểu đồ tròn: Sản phẩm được thuê nhiều nhất */}
                <Card className="chart-card">
                  <Card.Body>
                    <Card.Title>Sản phẩm được thuê nhiều nhất</Card.Title>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={topRentedProducts}
                        dataKey="rents"
                        nameKey="product"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {topRentedProducts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </Card.Body>
                </Card>

                {/* Có thể thêm các biểu đồ khác theo nhu cầu */}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Statistic;
