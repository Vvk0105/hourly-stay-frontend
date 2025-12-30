import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Radio,
  Button,
  Row,
  Col,
  Typography,
  Breadcrumb,
  Upload,
  Switch,
  Space,
  InputNumber,
  message,
  Card
} from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  CarOutlined,
  WifiOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  RocketOutlined // using as placeholder for pool if specific icon unavailable
} from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Mock Icons for Amenities
const AMENITIES_LIST = [
  { key: "parking", label: "Parking", icon: <CarOutlined /> },
  { key: "fitness", label: "Fitness", icon: <TrophyOutlined /> },
  { key: "cctv", label: "CCTV", icon: <VideoCameraOutlined /> },
  { key: "minibar", label: "Mini Bar", icon: <CoffeeOutlined /> },
  { key: "wifi", label: "Wifi", icon: <WifiOutlined /> },
  { key: "television", label: "Television", icon: <DesktopOutlined /> },
  { key: "cart", label: "Cart", icon: <ShoppingCartOutlined /> },
  { key: "pool", label: "Swimming pool", icon: <RocketOutlined rotate={90} /> },
];

function AddRoom() {
  const { id } = useParams(); // Hotel ID
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [hotelName, setHotelName] = useState("Loading...");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [hourlyBooking, setHourlyBooking] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Fetch Hotel Name for Breadcrumb/Title
  useEffect(() => {
    const fetchHotelName = async () => {
      try {
        const res = await api.get(`property/hotels/${id}/`);
        setHotelName(res.data.name);
      } catch (error) {
        console.error("Error fetching hotel", error);
        setHotelName("Hotel"); // Fallback
      }
    };
    fetchHotelName();
  }, [id]);

  // Handle Amenity Toggle
  const toggleAmenity = (key) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities(selectedAmenities.filter((k) => k !== key));
    } else {
      setSelectedAmenities([...selectedAmenities, key]);
    }
  };

  // Handle Image Upload Change
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Submit Handler
  const onFinish = async (values) => {
    const payload = {
      ...values,
      amenities: selectedAmenities,
      is_hourly_booking: hourlyBooking,
      hotel_id: id,
      // Handle images: usually you upload images first and get URLs, or send FormData
    };
    
    console.log("Submitting Room:", payload);
    message.success("Room added successfully (Mock)");
    navigate(`/hotels/${id}`);
    
    /* 
    // Actual API Call Example:
    try {
        await api.post(`property/hotels/${id}/rooms/`, payload);
        message.success("Room Created");
        navigate(`/hotels/${id}`);
    } catch(err) {
        message.error("Failed to create room");
    }
    */
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { href: "/dashboard", title: <HomeOutlined /> },
          { href: "/hotels", title: "Hotel Management" },
          { href: `/hotels/${id}`, title: hotelName },
          { title: "Add Room" },
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* Page Title */}
      <Title level={3} style={{ marginBottom: 30 }}>
        {hotelName}’s Add Room
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ac_type: "ac",
          currency: "₹",
        }}
      >
        <Row gutter={40}>
          
          {/* LEFT COLUMN: IMAGES */}
          <Col xs={24} lg={9}>
            {/* Main Image Placeholder */}
            <div style={{ 
              backgroundColor: '#e6e6e6', 
              borderRadius: 12, 
              height: 300, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 16
            }}>
               <Upload
                listType="picture-card"
                fileList={fileList.slice(0, 1)}
                onChange={handleUploadChange}
                beforeUpload={() => false} // Prevent auto upload
                showUploadList={{ showPreviewIcon: false }}
                maxCount={1}
               >
                  {fileList.length < 1 && (
                      <div>
                          <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                      </div>
                  )}
               </Upload>
            </div>

            {/* Small Images Row */}
            <Row gutter={16}>
                {[1, 2, 3].map((i) => (
                    <Col span={8} key={i}>
                        <div style={{ 
                            backgroundColor: '#e6e6e6', 
                            borderRadius: 8, 
                            height: 100,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                             <PlusOutlined style={{ fontSize: 20, color: '#999' }} />
                        </div>
                    </Col>
                ))}
            </Row>
          </Col>

          {/* RIGHT COLUMN: INPUT FIELDS */}
          <Col xs={24} lg={15}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Room Type" name="room_type" rules={[{ required: true }]}>
                  <Select placeholder="Select Room Type" size="large">
                    <Option value="single">Single Bedroom</Option>
                    <Option value="double">Double Bedroom</Option>
                    <Option value="suite">Suite</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Maximum Occupancy" name="max_occupancy">
                  <Select placeholder="Select Occupancy" size="large">
                    <Option value={1}>1 Person</Option>
                    <Option value={2}>2 Persons</Option>
                    <Option value={4}>4 Persons</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Price" name="price" rules={[{ required: true }]}>
                   <Input prefix="₹0/-" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Number Of Rooms" name="number_of_rooms">
                  <InputNumber style={{ width: '100%' }} size="large" placeholder="08" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Bed" name="bed_count">
                  <Select placeholder="1" size="large">
                    <Option value={1}>1 Bed</Option>
                    <Option value={2}>2 Beds</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Room Size" name="room_size">
                  <Input suffix="sq.feet" size="large" placeholder="144" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Bathroom" name="bathroom_count">
                  <Select placeholder="1" size="large">
                    <Option value={1}>1</Option>
                    <Option value={2}>2</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="AC/Non AC" name="ac_type">
                  <Radio.Group>
                    <Radio value="ac">AC</Radio>
                    <Radio value="non_ac">Non AC</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* FULL WIDTH SECTIONS */}
        <div style={{ marginTop: 20 }}>
            <Form.Item label="Description" name="description">
                <TextArea 
                    rows={4} 
                    placeholder="Description" 
                    style={{ borderRadius: 8, padding: 12 }}
                />
            </Form.Item>
        </div>

        {/* Amenities */}
        <div style={{ marginTop: 20 }}>
            <Title level={5}>Amenities</Title>
            <Space wrap size={[12, 12]}>
                {AMENITIES_LIST.map((item) => {
                    const isSelected = selectedAmenities.includes(item.key);
                    return (
                        <Button
                            key={item.key}
                            shape="round"
                            icon={item.icon}
                            size="large"
                            onClick={() => toggleAmenity(item.key)}
                            style={{
                                backgroundColor: isSelected ? '#1f1f1f' : '#fff',
                                color: isSelected ? '#fff' : '#000',
                                borderColor: isSelected ? '#1f1f1f' : '#d9d9d9',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {item.label}
                        </Button>
                    )
                })}
            </Space>
        </div>

        {/* Hourly Booking Toggle */}
        <div style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
            <Text strong style={{ marginRight: 16, fontSize: 16, color: '#666' }}>Hourly Booking</Text>
            <Switch 
                checked={hourlyBooking} 
                onChange={setHourlyBooking} 
            />
            <Text style={{ marginLeft: 12 }}>
                {hourlyBooking ? "Active" : "Inactive"}
            </Text>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50, gap: 20 }}>
            <Button 
                size="large" 
                style={{ width: 150, borderRadius: 24, height: 48 }}
                onClick={() => navigate(-1)}
            >
                Cancel
            </Button>
            <Button 
                type="primary" 
                htmlType="submit"
                size="large" 
                style={{ 
                    width: 150, 
                    borderRadius: 24, 
                    height: 48,
                    backgroundColor: '#1f1f1f',
                    borderColor: '#1f1f1f' 
                }}
            >
                Submit
            </Button>
        </div>

      </Form>
    </div>
  );
}

export default AddRoom;