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
  Image,
  Radio,
  Checkbox // Added Checkbox
} from "antd";
import { UploadOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import * as yup from 'yup';
import api from "../../api/axios";
import { getImageUrl } from "../../utils/imageUtils";
import PageHeader from "../../components/common/PageHeader";
import { Modal } from "antd";
import AdvancedLocationPicker from "../../components/common/AdvancedLocationPicker";

const { TextArea } = Input;
const { Option } = Select; // Added for Select.Option

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India - UTC+05:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE - UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (Thailand - UTC+07:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+01:00)' },
  { value: 'America/New_York', label: 'America/New York (UTC-05:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-08:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+11:00)' },
];

const CURRENCIES = [
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
  { value: 'LKR', label: 'LKR - Sri Lankan Rupee (Rs)' },
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit (RM)' },
  { value: 'THB', label: 'THB - Thai Baht (฿)' },
  { value: 'SAR', label: 'SAR - Saudi Riyal (﷼)' },
  { value: 'QAR', label: 'QAR - Qatari Riyal (﷼)' },
];

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
  // Added validation for banking details
  gstin: yup.string().when('is_gst_registered', {
    is: true,
    then: (schema) => schema.required('GSTIN is required if registered'),
    otherwise: (schema) => schema.notRequired(),
  }),
  bank_account_number: yup.string().required("Bank Account Number is required"),
});

const EditHotel = () => {
  const { id } = useParams(); // hotel id from URL
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [images, setImages] = useState([]);
  const [commissionType, setCommissionType] = useState('PERCENTAGE');
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [refundPolicyType, setRefundPolicyType] = useState('DEFAULT');

  // Handlers for Images
  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post(`property / hotels / ${id} /images/`, formData);
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
      await api.delete(`property / hotels / images / ${imageId}/`);
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
        const data = res.data; // Store data in a variable for easier access
        form.setFieldsValue({
          ...data,
          check_in_time: dayjs(data.check_in_time, "HH:mm"),
          check_out_time: dayjs(data.check_out_time, "HH:mm"),
        });

        // Handle Refund Policy population
        if (data.refund_policy) {
          setRefundPolicyType('CUSTOM');
          form.setFieldsValue({
            refund_policy_type: 'CUSTOM',
            full_refund_window_hours: data.refund_policy.full_refund_window_hours,
            no_refund_window_hours: data.refund_policy.no_refund_window_hours,
            partial_refund_percentage: data.refund_policy.partial_refund_percentage,
          });
        } else {
          setRefundPolicyType('DEFAULT');
          form.setFieldsValue({
            refund_policy_type: 'DEFAULT',
            full_refund_window_hours: 48, // defaults for display
            no_refund_window_hours: 24,
            partial_refund_percentage: 50
          });
        }

        setCommissionType(data.commission_type || 'PERCENTAGE');
        setIsGstRegistered(data.is_gst_registered || false); // Set GST registered state
        setImages(data.images || []);
        setLoading(false); // Set loading to false after data is fetched
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
        // Exclude read-only RazorpayX fields from patch payload
        if (key === 'razorpayx_contact_id' || key === 'razorpayx_fund_account_id') return;

        if (value !== undefined && value !== null && key !== 'refund_policy_type' &&
          key !== 'full_refund_window_hours' && key !== 'no_refund_window_hours' &&
          key !== 'partial_refund_percentage') {
          if (dayjs.isDayjs(value)) {
            formData.append(key, value.format("HH:mm"));
          } else {
            // Only append GSTIN if registered, otherwise ensure it's not sent or is null
            if (key === 'gstin' && !values.is_gst_registered) {
              formData.append(key, ''); // Send empty string or null if not registered
            } else {
              formData.append(key, value);
            }
          }
        }
      });

      await api.patch(`property/hotels/${id}/`, formData);

      // Handle Refund Policy Update
      if (refundPolicyType === 'DEFAULT') {
        // If User switched to DEFAULT, delete any custom policy
        try {
          await api.delete(`property/hotels/${id}/refund-policy/`);
        } catch (e) {
          console.log("Deletion ignored or not needed", e);
        }
      } else {
        // Upsert Custom Policy
        try {
          await api.post(`property/hotels/${id}/refund-policy/`, {
            full_refund_window_hours: values.full_refund_window_hours,
            no_refund_window_hours: values.no_refund_window_hours,
            partial_refund_percentage: values.partial_refund_percentage
          });
        } catch (e) {
          message.error("Failed to update refund policy");
        }
      }

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
                <Col xs={24} sm={12}>
                  <Form.Item label="Billing Email" name="email" rules={[{ type: 'email' }]} help="Used for RazorpayX Payout Receipts">
                    <Input placeholder="admin@hotel.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Billing Phone" name="phone">
                    <Input placeholder="9999999999" />
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
                      src={getImageUrl(img.thumbnail || img.image)} // Use thumbnail if available
                      alt="Hotel"
                      width="100%"
                      height={100}
                      style={{ objectFit: 'cover' }}
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
                <Col xs={24} sm={16}>
                  <Form.Item
                    label="Hotel Timezone"
                    name="timezone"
                    rules={[{ required: true, message: 'Please select hotel timezone' }]}
                    tooltip="All booking times will be displayed in this timezone"
                  >
                    <Select
                      placeholder="Select hotel timezone"
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {TIMEZONES.map(tz => (
                        <Option key={tz.value} value={tz.value}>{tz.label}</Option>
                      ))}
                    </Select>
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
              <Form.Item
                label="Hotel Currency"
                name="currency_code"
                rules={[{ required: true, message: 'Please select hotel currency' }]}
                tooltip="All room prices will be stored and displayed in this currency"
              >
                <Select
                  placeholder="Select hotel currency"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {CURRENCIES.map(c => (
                    <Option key={c.value} value={c.value}>{c.label}</Option>
                  ))}
                </Select>
              </Form.Item>
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

                  <Form.Item label="Razorpay Account ID" name="razorpay_account_id" tooltip="Linked account ID for split settlement">
                    <Input placeholder="acc_XXXXXXXXXXXXXX" />
                  </Form.Item>
                </>
              )}
            </Card>

            <Card title="Payout & Banking" style={{ marginTop: 24 }}>
              <Form.Item name="is_gst_registered" valuePropName="checked">
                <Checkbox onChange={(e) => setIsGstRegistered(e.target.checked)}>
                  Hotel is GST Registered
                </Checkbox>
              </Form.Item>

              {isGstRegistered && (
                <Form.Item
                  label="GSTIN"
                  name="gstin"
                  rules={[{ required: true, message: 'Please enter GSTIN' }]}
                >
                  <Input placeholder="22AAAAA0000A1Z5" />
                </Form.Item>
              )}

              <Form.Item
                label="Bank Account Number"
                name="bank_account_number"
                rules={[{ required: true, message: 'Please enter bank account number' }]}
              >
                <Input placeholder="Enter account number" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="IFSC Code"
                    name="bank_ifsc"
                    help="For domestic (Indian) banks"
                  >
                    <Input placeholder="SBIN0001234" />
                  </Form.Item>
                </Col>
                {form.getFieldValue('country') !== 'IN' && (
                  <Col span={12}>
                    <Form.Item
                      label="SWIFT/BIC Code"
                      name="bank_swift_code"
                      help="For international banks"
                    >
                      <Input placeholder="ABCDEF123" />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                RazorpayX Integration (Auto-filled on sync)
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Contact ID" name="razorpayx_contact_id">
                    <Input readOnly disabled placeholder="cont_..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Fund Account ID" name="razorpayx_fund_account_id">
                    <Input readOnly disabled placeholder="fa_..." />
                  </Form.Item>
                </Col>
              </Row>
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

            <Card title="Refund Policy" style={{ marginTop: 24 }}>
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
