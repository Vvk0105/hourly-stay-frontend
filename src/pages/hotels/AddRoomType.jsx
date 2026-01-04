import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Switch, Button, Row, Col, Typography, InputNumber, message, Card, Divider, Alert } from "antd";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { TextArea } = Input;
const { Text } = Typography;

function AddRoomType() {
  const { id } = useParams(); // Hotel ID
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isHourly, setIsHourly] = useState(false);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    
    const payload = {
      hotel: id,
      name: values.name,
      // Total inventory is just a number here for reference, 
      // actual inventory increases when adding Physical Rooms.
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
      navigate(`/hotels/${id}`);
    } catch (err) {
      message.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Add Room Category" />
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ max_adults: 2, is_hourly_enabled: false }}>
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Category Details">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Ex: Deluxe King' }]}>
                    <Input placeholder="e.g. Deluxe King" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Initial Inventory Count" name="total_inventory" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                   <Form.Item label="Max Adults" name="max_adults"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                </Col>
                <Col span={8}>
                   <Form.Item label="Max Children" name="max_children"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                </Col>
                <Col span={8}>
                   <Form.Item label="Size (Sq. Ft)" name="size_sqft"><InputNumber style={{ width: '100%' }} /></Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Description" name="description"><TextArea rows={3} /></Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Pricing & Rules">
              <Text strong>Standard Nightly Rate</Text>
              <Form.Item name="base_price_nightly" rules={[{ required: true }]} style={{ marginTop: 8 }}>
                <InputNumber style={{ width: '100%' }} prefix="₹" placeholder="2000" />
              </Form.Item>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>Enable Hourly?</Text>
                <Form.Item name="is_hourly_enabled" valuePropName="checked" noStyle>
                  <Switch onChange={(checked) => setIsHourly(checked)} />
                </Form.Item>
              </div>

              {isHourly && (
                <div style={{ backgroundColor: '#f6ffed', padding: 16, borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  <Form.Item label="Min Duration (Hrs)" name="min_duration_hours" initialValue={3} rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Base Price (Min Duration)" name="hourly_base_price" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} prefix="₹" />
                  </Form.Item>
                  <Form.Item label="Extra Hour Price" name="price_per_extra_hour" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} prefix="₹" />
                  </Form.Item>
                   <Form.Item label="Cleaning Gap (Mins)" name="cleaning_buffer_minutes" initialValue={30}>
                    <InputNumber step={15} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              )}
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 24, textAlign: 'right' }}>
           <Button onClick={() => navigate(-1)} style={{ marginRight: 12 }}>Cancel</Button>
           <Button type="primary" htmlType="submit" loading={loading}>Create Category</Button>
        </div>
      </Form>
    </div>
  );
}

export default AddRoomType;