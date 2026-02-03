import React, { useState } from "react";
import { Form, Input, Select, Button, Upload, Row, Col, TimePicker, Switch, InputNumber, message, Card, Radio } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import { Modal } from "antd";
import AdvancedLocationPicker from "../../components/common/AdvancedLocationPicker";

const { TextArea } = Input;
const { Option } = Select;

const AddHotel = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [refundPolicyType, setRefundPolicyType] = useState('DEFAULT');

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
        if (key !== 'images' && key !== 'check_in_time' && key !== 'check_out_time' &&
          key !== 'refund_policy_type' && key !== 'full_refund_window_hours' &&
          key !== 'no_refund_window_hours' && key !== 'partial_refund_percentage' &&
          values[key] !== undefined) {
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

      // 1. Create Hotel
      const res = await api.post("property/hotels/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const hotelId = res.data.id;

      // 2. Handle Custom Refund Policy
      if (refundPolicyType === 'CUSTOM') {
        try {
          await api.post(`property/hotels/${hotelId}/refund-policy/`, {
            full_refund_window_hours: values.full_refund_window_hours,
            no_refund_window_hours: values.no_refund_window_hours,
            partial_refund_percentage: values.partial_refund_percentage
          });
          message.success("Custom refund policy set!");
        } catch (policyErr) {
          console.error("Failed to set refund policy", policyErr);
          message.warning("Hotel created, but failed to set refund policy.");
        }
      }

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
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{
        is_hourly_enabled: false,
        refund_policy_type: 'DEFAULT',
        full_refund_window_hours: 48,
        no_refund_window_hours: 24,
        partial_refund_percentage: 50
      }}>

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
                  <Form.Item label="Country" name="country">
                    <Input placeholder="India" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Zip Code" name="zip_code" rules={[{ required: true }]}>
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
            <Card title="Financial Details" style={{ marginBottom: 24 }}>
              <Form.Item label="Tax Name" name="tax_name" help="e.g. GST, VAT">
                <Input placeholder="GST" />
              </Form.Item>
              <Form.Item label="Tax Percent (%)" name="tax_percent">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="18" />
              </Form.Item>

              {/* Commission Fields - Only for SUPER_ADMIN */}
              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>Platform Commission (Admin Only)</div>
              <Form.Item label="Commission Type" name="commission_type" initialValue="PERCENTAGE">
                <Select>
                  <Option value="PERCENTAGE">Percentage</Option>
                  <Option value="FIXED">Fixed Amount</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Commission (%)" name="commission_percent" initialValue={15}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="15" />
              </Form.Item>
              <Form.Item label="Razorpay Account ID" name="razorpay_account_id" help="Optional: For split settlement">
                <Input placeholder="acc_xxxxxxxxxxxxx" />
              </Form.Item>
            </Card>

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

            <Card title="Refund Policy" style={{ marginBottom: 24 }}>
              <Form.Item name="refund_policy_type" label="Select Policy">
                <Radio.Group onChange={(e) => setRefundPolicyType(e.target.value)}>
                  <Radio value="DEFAULT" style={{ display: 'block', marginBottom: 8 }}>
                    Default Policy
                    <div style={{ fontSize: '12px', color: '#888', marginLeft: 24 }}>
                      Full refund &gt; 48h, 50% refund &gt; 24h
                    </div>
                  </Radio>
                  <Radio value="CUSTOM" style={{ display: 'block' }}>Custom Policy</Radio>
                </Radio.Group>
              </Form.Item>

              {refundPolicyType === 'CUSTOM' && (
                <div style={{ borderLeft: '3px solid #1890ff', paddingLeft: 12 }}>
                  <Form.Item label="Full Refund Until (Hours before check-in)" name="full_refund_window_hours" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="No Refund Within (Hours before check-in)" name="no_refund_window_hours" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Partial Refund % (During window)" name="partial_refund_percentage" rules={[{ required: true }]}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              )}
            </Card>

            <Card title="Cover Image">
              <Form.Item name="images" valuePropName="fileList" getValueFromEvent={normFile}>
                <Upload listType="picture-card" beforeUpload={() => false} multiple>
                  <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload Images</div></div>
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

export default AddHotel;