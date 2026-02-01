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
  Upload,
  Tooltip,
  Image
} from "antd";
import { UploadOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import * as yup from 'yup';
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import { Modal } from "antd";
import AdvancedLocationPicker from "../../components/common/AdvancedLocationPicker";

const { TextArea } = Input;

const validationSchema = yup.object().shape({
  name: yup.string().required("Hotel Name is required"),
  address_line_1: yup.string().required("Address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  zip_code: yup.string().required("Zip Code is required"),
  check_in_time: yup.object().required("Check In Time is required"),
  check_out_time: yup.object().required("Check Out Time is required"),
  tax_percent: yup.number().min(0).max(100).required("Tax Percent is required"),
  commission_percent: yup.number().min(0).max(100),
  fixed_commission_amount: yup.number().min(0),
});

const EditHotel = () => {
  const { id } = useParams(); // hotel id from URL
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [images, setImages] = useState([]);
  const [commissionType, setCommissionType] = useState('PERCENTAGE'); // Add this for existing logic
  const { user } = useSelector((state) => state.auth);

  // Handlers for Images
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post(`property/hotels/${id}/images/`, formData);
      message.success("Image uploaded!");
      setImages([...images, res.data]);
      onSuccess("Ok");
    } catch (err) {
      message.error("Upload failed");
      onError({ err });
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`property/hotels/images/${imageId}/`);
      message.success("Image deleted");
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      message.error("Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await api.patch(`property/hotels/images/${imageId}/primary/`);
      message.success("Set as primary");
      // Update local state to reflect change (only one primary)
      setImages(images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
    } catch (err) {
      message.error("Failed to set primary");
    }
  };

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
        setImages(res.data.images || []);
      })
      .catch((err) => {
        console.error(err);
        message.error("Hotel not found");
        navigate("/hotels");
      });
  }, [id]);



  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Validate first
      await validationSchema.validate(values, { abortEarly: false });

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
      if (error instanceof yup.ValidationError) {
        error.inner.forEach(err => {
          message.error(err.message);
        });
      } else if (error.response?.data) {
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

            <Card title="Hotel Images" style={{ marginTop: 24 }}>
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
                {images.map(img => (
                  <div key={img.id} style={{ position: 'relative', width: 150, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                    <Image
                      src={img.thumbnail || img.image} // Use thumbnail if available
                      alt="Hotel"
                      style={{ width: '100%', height: 100, objectFit: 'cover' }}
                      preview={{
                        src: img.large || img.image, // Use large image for preview
                      }}
                    />
                    <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
                      <Tooltip title={img.is_primary ? "Primary Image" : "Set as Primary"}>
                        <Button
                          type="text"
                          icon={img.is_primary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                          onClick={() => handleSetPrimary(img.id)}
                        />
                      </Tooltip>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteImage(img.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
