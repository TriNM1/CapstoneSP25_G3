import React from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { FaFilter } from "react-icons/fa";
import "./FilterPanel.scss";

const FilterPanel = ({
  showFilter,
  onToggle,
  onSubmit,
  filterValues,
  onChange,
}) => {
  return (
    <div className="filter-panel-wrapper">
      <div className="filter-toggle mb-3">
        <Button variant="outline-secondary" onClick={onToggle}>
          <FaFilter /> {showFilter ? "Đóng bộ lọc" : "Mở bộ lọc"}
        </Button>
      </div>
      {showFilter && (
        <div className="filter-panel mb-4">
          <Form onSubmit={onSubmit}>
            <Row>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterColor">
                  <Form.Label>Màu sắc</Form.Label>
                  <Form.Control
                    as="select"
                    name="color"
                    value={filterValues.color}
                    onChange={onChange}
                  >
                    <option value="">Chọn màu sắc</option>
                    <option value="red">Đỏ</option>
                    <option value="blue">Xanh dương</option>
                    <option value="green">Xanh lá</option>
                    <option value="yellow">Vàng</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterCondition">
                  <Form.Label>Tình trạng</Form.Label>
                  <Form.Control
                    as="select"
                    name="condition"
                    value={filterValues.condition}
                    onChange={onChange}
                  >
                    <option value="">Chọn tình trạng</option>
                    <option value="new">Mới</option>
                    <option value="used">Cũ</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterCategory">
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Control
                    as="select"
                    name="category"
                    value={filterValues.category}
                    onChange={onChange}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="xe">Xe</option>
                    <option value="robot">Robot</option>
                    <option value="bupbe">Búp bê</option>
                    <option value="khixep">Khối xếp hình</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterAgeRange">
                  <Form.Label>Độ tuổi</Form.Label>
                  <Form.Control
                    as="select"
                    name="ageRange"
                    value={filterValues.ageRange}
                    onChange={onChange}
                  >
                    <option value="">Chọn độ tuổi</option>
                    <option value="0-3">0-3</option>
                    <option value="4-6">4-6</option>
                    <option value="7-9">7-9</option>
                    <option value="10+">10+</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterBrand">
                  <Form.Label>Thương hiệu</Form.Label>
                  <Form.Control
                    as="select"
                    name="brand"
                    value={filterValues.brand}
                    onChange={onChange}
                  >
                    <option value="">Chọn thương hiệu</option>
                    <option value="brandA">Brand A</option>
                    <option value="brandB">Brand B</option>
                    <option value="brandC">Brand C</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col xs={12} md={4} className="mb-3">
                <Form.Group controlId="filterDistance">
                  <Form.Label>Khoảng cách</Form.Label>
                  <Form.Control
                    as="select"
                    name="distance"
                    value={filterValues.distance}
                    onChange={onChange}
                  >
                    <option value="">Chọn khoảng cách</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="15">15 km</option>
                    <option value="20">20 km</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" type="submit">
              Áp dụng bộ lọc
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
