import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaFacebookF,
  FaTwitter,
  FaGoogle,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaHome,
  FaEnvelope,
  FaPhone,
  FaPrint,
} from "react-icons/fa";
import "./Footer.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid className="py-4 bg-light">
        {/* Social Media Section */}
        {/* Footer Links */}
        <Row className="text-dark text-md-start">
          <Col md={4}>
            <h6 className="fw-bold">COMPANY NAME</h6>
            <p>
              Here you can use rows and columns to organize your footer content.
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            </p>
          </Col>
          <Col md={1}></Col>
          <Col md={3}>
            <p>Get connected with us on social networks:</p>
            <div className="social-icons">
              <a href="#">
                <FaFacebookF />
              </a>
              <a href="#">
                <FaLinkedin />
              </a>
              <a href="#">
                <FaGithub />
              </a>
            </div>
          </Col>
          <Col md={1}></Col>
          <Col md={3}>
            <h6 className="fw-bold">CONTACT</h6>
            <ul className="list-unstyled">
              <li>
                <FaHome /> New York, NY 10012, US
              </li>
              <li>
                <FaEnvelope /> info@example.com
              </li>
              <li>
                <FaPhone /> + 01 234 567 88
              </li>
              <li>
                <FaPrint /> + 01 234 567 89
              </li>
            </ul>
          </Col>
        </Row>

        {/* Copyright Section */}
        <Row className="mt-4">
          <Col className="text-center">
            <p className="mb-0">
              © {new Date().getFullYear()} Toy Sharing. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
