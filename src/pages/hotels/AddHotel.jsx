import { Form, Input, Select, Button, Upload, Row, Col, TimePicker, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import api from "../../api/axios";

const { TextArea } = Input;
const { Option } = Select;

const AddHotel = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (values.images && values.images.length > 0) {
        values.images.forEach((file) => {
          formData.append('images', file.originFileObj);
        });
      }

      if (values.checkIn) {
        formData.append("check_in_time", values.checkIn.format("HH:mm"));
      }
      if (values.checkOut) {
        formData.append("check_out_time", values.checkOut.format("HH:mm"));
      }

      const textFields = ["name", "address", "state", "zip_code", "city", "phone_number", "email", "description"];
      textFields.forEach((field) => {
        if (values[field]) {
          formData.append(field, values[field]);
        }
      });

      await api.post("property/hotels/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Hotel created successfully!");
      navigate("/hotels");
    } catch (error) {
      console.error("Failed to create hotel:", error);
      message.error(error.response?.data?.detail || "Failed to create hotel. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Add Hotel" />
      <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Upload Images"
                name="images"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload 
                  listType="picture-card" 
                  multiple={true}
                  beforeUpload={() => false}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Hotel Name" name="name" rules={[{ required: true }]}>
                    <Input placeholder="Hotel Name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Address" name="address">
                    <Input placeholder="Address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="State" name="state">
                    <Select placeholder="Select State">
                      <Option value="kerala">Kerala</Option>
                      <Option value="delhi">Delhi</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="ZIP Code" name="zip_code">
                    <Input placeholder="ZIP Code" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="City" name="city">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Phone Number" name="phone_number">
                    <Input placeholder="Phone Number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email ID" name="email">
                    <Input placeholder="Email ID" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Check In Time" name="checkIn">
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Check Out Time" name="checkOut">
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <TextArea rows={4} placeholder="Description" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button onClick={() => navigate("/hotels")}>Cancel</Button>
            <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ background: "#000" }}
            >
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default AddHotel;