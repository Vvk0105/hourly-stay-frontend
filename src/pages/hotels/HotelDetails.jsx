import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb, Button, Spin, Tag, message, Modal, Form, Input, InputNumber, Row, Col, Card, Divider, Typography, Switch } from "antd";
import { HomeOutlined, EditOutlined, DeleteOutlined, RightOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import "./HotelDetails.css";

const { TextArea } = Input;
const { Text } = Typography;

// Placeholder images for mockup feel
const MAIN_IMAGE = "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop";
const THUMB_1 = "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop";
const THUMB_2 = "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop";
const THUMB_3 = "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop";

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [isHourly, setIsHourly] = useState(false);

  const fetchHotel = async () => {
    try {
      const res = await api.get(`property/hotels/${id}/`);
      setHotel(res.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load hotel details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, [id]);



  // Merge real data with dummy if real is empty, or just append for viewing
  const displayCategories = (hotel?.room_types && hotel.room_types.length > 0)
    ? hotel.room_types
    : [];

  const handleCreateCategory = async (values) => {
    setConfirmLoading(true);

    // Payload construction (matching AddRoomType logic)
    const payload = {
      hotel: id,
      name: values.name,
      total_inventory: values.total_inventory,
      max_adults: values.max_adults,
      max_children: values.max_children,
      size_sqft: values.size_sqft,
      base_price_nightly: values.base_price_nightly,
      description: values.description,
      is_hourly_enabled: values.is_hourly_enabled,
    };

    if (values.is_hourly_enabled) {
      payload.hourly_config = {
        min_duration_hours: values.min_duration_hours,
        base_price: values.hourly_base_price,
        price_per_extra_hour: values.price_per_extra_hour,
        cleaning_buffer_minutes: values.cleaning_buffer_minutes || 30,
        is_active: true
      };
    } else {
      payload.hourly_config = null;
    }

    try {
      await api.post(`property/hotels/${id}/room-types/`, payload);
      message.success("Category Created Successfully");
      setIsModalVisible(false);
      form.resetFields();
      setIsHourly(false);
      fetchHotel(); // Refresh data to show new category
    } catch (err) {
      console.error(err);
      message.error("Failed to create category");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!hotel) return <div>Hotel not found</div>;

  return (
    <div className="hotel-details-container">
      {/* Breadcrumb */}
      <div className="hd-breadcrumb">
        <Breadcrumb
          items={[
            { href: '/dashboard', title: <><HomeOutlined /> Home</> },
            { href: '/hotels', title: 'Hotel Management' },
            { title: hotel.name }
          ]}
        />
      </div>

      {/* Header with Actions */}
      <div className="hd-header">
        <div>
          <h1 className="hd-title" style={{ marginBottom: 8 }}>{hotel.name}</h1>

        </div>
        <div>
          <EditOutlined
            className="hd-action-icon"
            onClick={() => navigate(`/hotels/${id}/edit`)}
            title="Edit Hotel"
          />
          <DeleteOutlined
            className="hd-action-icon danger"
            onClick={() => message.warning("Delete functionality not implemented yet")}
            title="Delete Hotel"
          />
        </div>
      </div>

      {/* Main Info Card */}
      <div className="hd-main-card">
        <div className="hd-layout-row">
          {/* Left: Gallery */}
          <div className="hd-gallery">
            <img src={hotel.images?.[0]?.url || MAIN_IMAGE} alt="Main" className="hd-main-image" />
            <div className="hd-thumbnails">
              <img src={hotel.images?.[1]?.url || THUMB_1} alt="Thumb 1" className="hd-thumb" />
              <img src={hotel.images?.[2]?.url || THUMB_2} alt="Thumb 2" className="hd-thumb" />
              <div className="hd-thumb more-overlay" style={{ backgroundImage: `url(${hotel.images?.[3]?.url || THUMB_3})`, backgroundSize: 'cover' }}>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="hd-info">
            <div className="hd-info-grid">
              <div className="hd-info-item">
                <span className="hd-label">Address</span>
                <span className="hd-value">{hotel.address_line_1}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">State</span>
                <span className="hd-value">{hotel.state || "Kerala"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">City</span>
                <span className="hd-value">{hotel.city}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">ZIP Code</span>
                <span className="hd-value">{hotel.zip_code || "N/A"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">Email ID</span>
                <span className="hd-value">{hotel.email || "N/A"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">Phone Number</span>
                <span className="hd-value">{hotel.phone_number || "N/A"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">Standard Check In Time</span>
                <span className="hd-value">{hotel.check_in_time || "12:00 PM"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">Standard Check Out Time</span>
                <span className="hd-value">{hotel.check_out_time || "11:00 AM"}</span>
              </div>
              <div className="hd-info-item">
                <span className="hd-label">Hourly Enabled</span>
                <span className="hd-value">
                  <Tag color={hotel.is_hourly_enabled ? "green" : "red"}>
                    {hotel.is_hourly_enabled ? "YES" : "NO"}</Tag>
                </span>
              </div>
              {hotel.is_hourly_enabled && (
                <div className="hd-info-item">
                  <span className="hd-label">Hourly Status</span>
                  <span className="hd-value">
                    <Button
                      type="primary"
                      danger={!hotel.is_hourly_enabled}
                      style={hotel.is_hourly_enabled ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
                      onClick={() => navigate(`/hotels/${id}/hourly-status`)}
                      size="small"
                    >
                      {hotel.is_hourly_enabled ? "Hourly Active" : "Hourly Inactive"}
                      <span style={{ marginLeft: 8 }}>Manage</span>
                    </Button>
                  </span>
                </div>
              )}
            </div>

            <div className="hd-info-item">
              <span className="hd-description-label">Description</span>
              <p className="hd-description">
                {hotel.description || `${hotel.name} is a modern hotel providing excellent amenities and comfortable stays.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="hd-section-header">
        <h2 className="hd-section-title">Categories</h2>
        <Button
          className="hd-add-btn"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Category
        </Button>
      </div>

      <div className="hd-categories-grid">
        {displayCategories && displayCategories.length > 0 ? (
          displayCategories.map((type) => (
            <div
              key={type.id}
              className="hd-category-card"
              onClick={() => navigate(`/hotels/${id}/categories/${type.id}`)}
            >
              {/* Use first image if available or placeholder */}
              <img
                src={THUMB_1}
                alt={type.name}
                className="hd-cat-image"
              />
              <div className="hd-cat-details">
                <div className="hd-cat-name">{type.name}</div>
                <div className="hd-cat-sub">
                  {type.is_hourly_enabled ? "Hourly & Nightly" : "Nightly Only"}
                  <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                  Inv: {type.total_inventory ?? 0}
                </div>
              </div>
              <RightOutlined className="hd-cat-arrow" />
            </div>
          ))
        ) : (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No categories added yet.</div>
        )}
      </div>

      <Modal
        title={<span style={{ fontSize: '20px', fontWeight: '600' }}>Add Room Category</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        width={800}
        okText="Create Category"
        okButtonProps={{ style: { backgroundColor: '#1a1a1a', borderRadius: '20px' } }}
        cancelButtonProps={{ style: { borderRadius: '20px' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCategory}
          initialValues={{ max_adults: 2, is_hourly_enabled: false }}
          style={{ marginTop: 20 }}
        >
          <Row gutter={24}>
            {/* Left Column: Basic Details */}
            <Col span={14}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Ex: Deluxe King' }]}>
                    <Input placeholder="e.g. Deluxe King" style={{ borderRadius: '8px' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Initial Inventory" name="total_inventory" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%', borderRadius: '8px' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Adults" name="max_adults"><InputNumber min={1} style={{ width: '100%', borderRadius: '8px' }} /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Child" name="max_children"><InputNumber min={0} style={{ width: '100%', borderRadius: '8px' }} /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Sq. Ft" name="size_sqft"><InputNumber style={{ width: '100%', borderRadius: '8px' }} /></Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Description" name="description"><TextArea rows={3} style={{ borderRadius: '8px' }} /></Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Right Column: Pricing & Hourly */}
            <Col span={10}>
              <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '12px' }}>
                <Text strong>Pricing Rules</Text>
                <Form.Item label="Nightly Rate (₹)" name="base_price_nightly" rules={[{ required: true }]} style={{ marginTop: 12 }}>
                  <InputNumber style={{ width: '100%', borderRadius: '8px' }} prefix="₹" placeholder="2000" />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                  <Text strong>Enable Hourly?</Text>
                  <Form.Item name="is_hourly_enabled" valuePropName="checked" noStyle>
                    <Switch onChange={(checked) => setIsHourly(checked)} />
                  </Form.Item>
                </div>

                {isHourly && (
                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <Form.Item label="Min Hrs" name="min_duration_hours" initialValue={3} rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <InputNumber min={1} style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                    <Form.Item label="Base Price (₹)" name="hourly_base_price" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <InputNumber style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                    <Form.Item label="Extra Hr Price (₹)" name="price_per_extra_hour" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <InputNumber style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                    <Form.Item label="Cleaning Gap (Mins)" name="cleaning_buffer_minutes" initialValue={30} style={{ marginBottom: 0 }}>
                      <InputNumber step={15} style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

    </div >
  );
}

export default HotelDetails;
