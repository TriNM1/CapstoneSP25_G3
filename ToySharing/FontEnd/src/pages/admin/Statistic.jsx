import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import AdminSideMenu from "../../components/AdminSideMenu";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import banner from "../../assets/banner2.jpg";
import "./Statistic.scss";

const Statistic = () => {
  const [monthlyUsers, setMonthlyUsers] = useState([]);
  const [monthlyPosts, setMonthlyPosts] = useState([]);

  useEffect(() => {
    // Fetch dữ liệu người dùng
    fetch("https://localhost:7128/api/User/role/user")
      .then(response => response.json())
      .then(data => {
        const usersByMonth = processUserData(data);
        setMonthlyUsers(usersByMonth);
      });

    // Fetch dữ liệu bài đăng
    fetch("https://localhost:7128/api/Products")
      .then(response => response.json())
      .then(data => {
        const postsByMonth = processPostData(data);
        setMonthlyPosts(postsByMonth);
      });
  }, []);

  // Xử lý dữ liệu người dùng
  const processUserData = (users) => {
    const usersByMonth = {};

    users.forEach(user => {
      const month = new Date(user.createdAt).toLocaleString('default', { month: 'long' });
      if (!usersByMonth[month]) {
        usersByMonth[month] = 0;
      }
      usersByMonth[month]++;
    });

    return Object.keys(usersByMonth).map(month => ({
      month,
      users: usersByMonth[month]
    }));
  };

  // Xử lý dữ liệu bài đăng
  const processPostData = (posts) => {
    const postsByMonth = {};

    posts.forEach(post => {
      const month = new Date(post.createdAt).toLocaleString('default', { month: 'long' });
      if (!postsByMonth[month]) {
        postsByMonth[month] = 0;
      }
      postsByMonth[month]++;
    });

    return Object.keys(postsByMonth).map(month => ({
      month,
      posts: postsByMonth[month]
    }));
  };

  return (
    <div className="admin-page statistic">
      <Container fluid className="mt-4">
        <Row>
          {/* Side menu dùng chung */}
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

          {/* Nội dung chính */}
          <Col xs={12} md={10} className="main-content">
            <div className="guide-content">
              <h1>Thống kê</h1>
              <div className="charts-container">
                {/* Biểu đồ đường: Lượng người dùng hàng tháng */}
                <Card className="chart-card">
                  <Card.Body>
                    <Card.Title>Lượng người dùng hàng tháng</Card.Title>
                    <LineChart width={600} height={300} data={monthlyUsers}>
                      <Line type="monotone" dataKey="users" stroke="#ff6f61" strokeWidth={2} />
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
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Statistic;