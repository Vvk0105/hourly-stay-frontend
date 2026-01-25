import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  TimePicker,
  Switch,
  InputNumber,
  message,
  Card,
  Select,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import { Modal } from "antd";
import AdvancedLocationPicker from "../../components/common/AdvancedLocationPicker";

const { TextArea } = Input;

const EditHotel = () => {
  const { id } = useParams(); // hotel id from URL
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const handleMapOk = () => {
    if (mapPosition) {
      form.setFieldsValue({
        latitude: mapPosition.lat,
        longitude: mapPosition.lng
      });
      message.success("Location selected from map!");
    }
    setIsMapModalVisible(false);
  };

  // Load hotel details
  useEffect(() => {
    api.get(`property/hotels/${id}/`)
      .then(res => {
        form.setFieldsValue({
          ...res.data,
          check_in_time: dayjs(res.data.check_in_time, "HH:mm"),
          check_out_time: dayjs(res.data.check_out_time, "HH:mm"),
        });
        setCommissionType(res.data.commission_type || 'PERCENTAGE');
      })
      .catch(() => {
        message.error("Hotel not found");
        navigate("/hotels");
      });
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (dayjs.isDayjs(value)) {
            formData.append(key, value.format("HH:mm"));
          } else {
            formData.append(key, value);
          }
        }
      });

      await api.patch(`property/hotels/${id}/`, formData);

      message.success("Hotel updated successfully");
      navigate("/hotels");
    } catch (error) {
      if (error.response?.data) {
        Object.entries(error.response.data).forEach(([field, errors]) => {
          message.error(`${field}: ${errors.join(", ")}`);
        });
      } else {
        message.error("Failed to update hotel");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Edit Hotel" />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ is_hourly_enabled: false }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Basic Details">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Hotel Name"
                    name="name"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="Description" name="description">
                    <TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Location" style={{ marginTop: 24 }}>
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item label="Address" name="address_line_1">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="City" name="city">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="State" name="state">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Country" name="country">
                    <Input placeholder="India" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Zip Code" name="zip_code">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Button
                    type="dashed"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            form.setFieldsValue({
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude
                            });
                            message.success('Location fetched successfully!');
                          },
                          () => {
                            message.error('Unable to get your location');
                          }
                        );
                      } else {
                        message.error('Geolocation not supported');
                      }
                    }}
                    style={{ marginRight: 12 }}
                  >
                    📍 Get Current Location
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setIsMapModalVisible(true)}
                  >
                    🗺️ Pick from Map
                  </Button>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Latitude" name="latitude">
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Longitude" name="longitude">
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Financial Details" style={{ marginTop: 24 }}>
              <Form.Item label="Tax Name" name="tax_name" help="e.g. GST, VAT">
                <Input placeholder="GST" />
              </Form.Item>
              <Form.Item label="Tax Percent (%)" name="tax_percent">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="18" />
              </Form.Item>

              {/* Commission Fields - Only for SUPER_ADMIN */}
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>Platform Commission</div>
                  <Form.Item label="Commission Type" name="commission_type">
                    <Select onChange={setCommissionType}>
                      <Option value="PERCENTAGE">Percentage</Option>
                      <Option value="FIXED">Fixed Amount</Option>
                    </Select>
                  </Form.Item>

                  {commissionType === 'PERCENTAGE' ? (
                    <Form.Item label="Commission (%)" name="commission_percent">
                      <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="15" />
                    </Form.Item>
                  ) : (
                    <Form.Item label="Fixed Commission (₹)" name="fixed_commission_amount">
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="500" />
                    </Form.Item>
                  )}

                  <Form.Item label="Razorpay Account ID" name="razorpay_account_id" help="Optional: For split settlement">
                    <Input placeholder="acc_xxxxxxxxxxxxx" />
                  </Form.Item>
                </>
              )}
            </Card>

            <Card title="Operations">
              <Form.Item label="Check In Time" name="check_in_time">
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="Check Out Time" name="check_out_time">
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Enable Hourly Booking"
                name="is_hourly_enabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Button onClick={() => navigate("/hotels")} style={{ marginRight: 12 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update Hotel
          </Button>
        </div>
      </Form>

      <Modal
        title="Search & Pick Location"
        open={isMapModalVisible}
        onOk={handleMapOk}
        onCancel={() => setIsMapModalVisible(false)}
        width={900}
        okText="Confirm Location"
      >
        {isMapModalVisible && (
          <AdvancedLocationPicker
            initialLat={form.getFieldValue('latitude')}
            initialLng={form.getFieldValue('longitude')}
            onLocationSelect={setMapPosition}
          />
        )}
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0f2f5', borderRadius: 4 }}>
          <small>💡 <strong>Tip:</strong> Search for a location using the search bar, or drag the map to position the marker at your hotel's location.</small>
        </div>
      </Modal>
    </div>
  );
};

export default EditHotel;
