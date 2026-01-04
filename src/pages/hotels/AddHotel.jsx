import React, { useState } from "react";
import { Form, Input, Select, Button, Upload, Row, Col, TimePicker, Switch, InputNumber, message, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios"; 
import PageHeader from "../../components/common/PageHeader";

const { TextArea } = Input;
const { Option } = Select;

const AddHotel = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Append standard fields
      Object.keys(values).forEach(key => {
        if (key !== 'images' && key !== 'check_in_time' && key !== 'check_out_time' && values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      // Format Times
      if (values.check_in_time) formData.append("check_in_time", values.check_in_time.format("HH:mm"));
      if (values.check_out_time) formData.append("check_out_time", values.check_out_time.format("HH:mm"));

      // Handle Images
      if (values.images?.length > 0) {
        values.images.forEach((file) => {
          formData.append('images', file.originFileObj);
        });
      }

      await api.post("property/hotels/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Hotel created successfully!");
      navigate("/hotels");
    } catch (error) {
      console.error(error);
      message.error("Failed to create hotel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Add New Hotel" />
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_hourly_enabled: false }}>
        
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Basic Details" style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Hotel Name" name="name" rules={[{ required: true }]}>
                            <Input placeholder="Grand Luxury Hotel" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Star Rating" name="star_rating">
                            <InputNumber min={1} max={5} step={0.5} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item label="Description" name="description">
                            <TextArea rows={3} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="Location">
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item label="Address" name="address_line_1" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="City" name="city" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="State" name="state" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="Zip Code" name="zip_code" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Latitude" name="latitude" help="e.g. 12.9716">
                            <InputNumber style={{ width: '100%' }} precision={6} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Longitude" name="longitude" help="e.g. 77.5946">
                            <InputNumber style={{ width: '100%' }} precision={6} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Operations" style={{ marginBottom: 24 }}>
                <Form.Item label="Standard Check In" name="check_in_time" rules={[{ required: true }]}>
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Standard Check Out" name="check_out_time" rules={[{ required: true }]}>
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                </Form.Item>
                
                <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 8, marginTop: 16 }}>
                    <Form.Item 
                        label="Enable Hourly Booking?" 
                        name="is_hourly_enabled" 
                        valuePropName="checked"
                        help="Master switch for this hotel"
                        style={{ marginBottom: 0 }}
                    >
                        <Switch />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Cover Image">
                <Form.Item name="images" valuePropName="fileList" getValueFromEvent={normFile}>
                    <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
                        <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
                    </Upload>
                </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button onClick={() => navigate("/hotels")} style={{ marginRight: 12 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">Create Hotel</Button>
        </div>
      </Form>
    </div>
  );
};

export default AddHotel;