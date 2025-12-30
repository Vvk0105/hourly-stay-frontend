import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Row, Col, Typography, Button, Spin, Breadcrumb, 
  Image, Space, Card, Tag, message, theme 
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  HomeOutlined, 
  RightOutlined,
  EnvironmentOutlined 
} from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text, Paragraph } = Typography;

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Hotel Data
  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      // Adjust endpoint based on your actual API backend
      const res = await api.get(`property/hotels/${id}/`); 
      setHotel(res.data);
    } catch (error) {
      console.error("Failed to fetch hotel", error);
      message.error("Could not load hotel details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hotel) return <div>Hotel not found</div>;

  // --- Mocking Image/Room Data for UI if API doesn't provide it yet ---
  const mainImage = hotel.image || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop";
  const galleryImages = [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop"
  ];
  
  // If your API returns rooms inside the hotel object, use that. Otherwise, mock it.
  const rooms = hotel.rooms || [
    { id: 1, name: "Single Bedroom", type: "Non AC", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop" },
    { id: 2, name: "Double Bedroom", type: "AC", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop" },
    { id: 3, name: "Suite Room", type: "AC", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop" },
    { id: 4, name: "Single Bedroom", type: "Non AC", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop" },
  ];
  // -------------------------------------------------------------------

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { href: '/dashboard', title: <HomeOutlined /> },
          { href: '/hotels', title: 'Hotel Management' },
          { title: hotel.name },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* 2. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{hotel.name}</Title>
        <Space>
            {/* Using standard Antd icons, styled transparently */}
            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/hotels/edit/${hotel.id}`)} />
            <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      </div>

      <Row gutter={[32, 32]}>
        {/* 3. Left Column: Images */}
        <Col xs={24} lg={10}>
          {/* Main Large Image */}
          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, height: 300 }}>
            <Image 
                src={mainImage} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                height={300}
                width="100%"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          <Row gutter={[16, 16]}>
            {galleryImages.map((img, index) => (
               <Col span={8} key={index}>
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 80 }}>
                    <Image 
                        src={img} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        height={80}
                        preview={index !== 2} // Disable default preview for the last one if we want custom overlay
                    />
                    {/* The +5 Overlay on the last image */}
                    {index === 2 && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                            justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                            color: '#fff', fontWeight: 'bold', fontSize: 16
                        }}>
                            5+
                        </div>
                    )}
                  </div>
               </Col> 
            ))}
          </Row>
        </Col>

        {/* 4. Right Column: Hotel Details */}
        <Col xs={24} lg={14}>
            <Row gutter={[24, 24]}>
                {/* Information Grid */}
                <InfoItem label="Address" value={hotel.address || "N/A"} />
                <InfoItem label="State" value={hotel.state || "N/A"} />
                
                <InfoItem label="City" value={hotel.city || "N/A"} />
                <InfoItem label="ZIP Code" value={hotel.zip_code || "N/A"} />
                
                <InfoItem label="Email ID" value={hotel.email || "N/A"} />
                <InfoItem label="Phone Number" value={hotel.phone_number || "N/A"} />
                
                <InfoItem label="Standard Check In Time" value={hotel.check_in_time || "12:00 PM"} />
                <InfoItem label="Standard Check Out Time" value={hotel.check_out_time || "11:00 AM"} />
            </Row>

            <div style={{ marginTop: 32 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
                <Paragraph style={{ marginTop: 4, color: token.colorTextHeading }}>
                    {hotel.description || "Aston Hotel, Alice Springs NT 7000, India is a modern hotel. elegant 5 star hotel overlooking the sea. perfect for a romantic, charming. Aston Hotel, Alice Springs NT 7000, India is a modern hotel."}
                </Paragraph>
            </div>
        </Col>
      </Row>

      {/* 5. Rooms Section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4}>Rooms</Title>
            <Button 
                type="primary" 
                style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f' }}
                onClick={() => navigate(`/hotels/${id}/add-room`)}
            >
                + Add Room
            </Button>
        </div>

        <Row gutter={[24, 24]}>
            {rooms.map((room) => (
                <Col xs={24} md={12} key={room.id}>
                    <Card 
                        hoverable 
                        bodyStyle={{ padding: 0 }}
                        style={{ overflow: 'hidden', borderRadius: 8, backgroundColor: '#f9f9f9', border: 'none' }}
                        onClick={() => navigate(`/hotels/${id}/rooms/${room.id}`)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {/* Room Image */}
                            <div style={{ width: 120, height: 90, flexShrink: 0 }}>
                                <img 
                                    src={room.image} 
                                    alt={room.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>
                            
                            {/* Room Text */}
                            <div style={{ padding: '0 16px', flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                                    {room.name}
                                </div>
                                <Text type="secondary">{room.type}</Text>
                            </div>

                            {/* Arrow Icon */}
                            <div style={{ paddingRight: 24 }}>
                                <RightOutlined style={{ color: '#999' }} />
                            </div>
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
      </div>

    </div>
  );
}

// Helper component to ensure grid alignment of details
const InfoItem = ({ label, value }) => (
    <Col span={12}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>{label}</Text>
            <Text strong style={{ fontSize: 14 }}>{value}</Text>
        </div>
    </Col>
);

export default HotelDetails;