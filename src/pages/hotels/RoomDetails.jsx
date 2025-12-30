import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Row, Col, Typography, Breadcrumb, Image, Button, Space, Spin, message, theme 
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  HomeOutlined,
  WifiOutlined,
  VideoCameraOutlined,
  CoffeeOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  RocketOutlined 
} from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text, Paragraph } = Typography;

// Helper to map amenity keys to Icons
const getAmenityIcon = (key) => {
    const icons = {
        fitness: <TrophyOutlined />,
        cctv: <VideoCameraOutlined />,
        minibar: <CoffeeOutlined />,
        wifi: <WifiOutlined />,
        television: <DesktopOutlined />,
        cart: <ShoppingCartOutlined />,
        pool: <RocketOutlined rotate={90} />, // Placeholder for pool
    };
    return icons[key.toLowerCase()] || <HomeOutlined />;
};

function RoomDetails() {
  const { id, roomId } = useParams(); // id = Hotel ID, roomId = Room ID
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);

  // Fetch Data
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        // Replace with your actual endpoint
        // const res = await api.get(`property/hotels/${id}/rooms/${roomId}/`);
        // setRoom(res.data);
        
        // --- MOCK DATA FOR UI DEMO (Delete this block when API is ready) ---
        await new Promise(r => setTimeout(r, 800)); // Simulate delay
        setRoom({
            id: roomId,
            hotelName: "Aston Hotel",
            name: "Single Bedroom",
            roomType: "Single Bedroom",
            occupancy: "2 Adult",
            price: "1500",
            count: "08",
            bed: "1",
            bathroom: "1",
            size: "144",
            acType: "AC",
            description: "Aston Hotel, Alice Springs NT 7000, India is a modern hotel. elegant 5 star hotel overlooking the sea.",
            images: [
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop"
            ],
            amenities: ["Fitness", "CCTV", "Mini Bar", "Wifi", "Television", "Cart", "Swimming pool"],
            hourlyRates: [
                { time: "2 Hours", price: "1,100" },
                { time: "3 Hours", price: "1,100" },
                { time: "5 Hours", price: "2,100" }
            ]
        });
        // ------------------------------------------------------------------

      } catch (error) {
        console.error(error);
        message.error("Failed to load room details");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id, roomId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}><Spin size="large" /></div>;
  if (!room) return <div>Room not found</div>;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { href: '/dashboard', title: <HomeOutlined /> },
          { href: '/hotels', title: 'Hotel Management' },
          { href: `/hotels/${id}`, title: room.hotelName },
          { title: room.name }, // e.g. Single Bedroom
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* 2. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
            {room.hotelName}’s {room.name}
        </Title>
        <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => console.log("Edit")} />
            <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      </div>

      <Row gutter={[32, 32]}>
        {/* 3. Left Column: Images */}
        <Col xs={24} lg={10}>
             {/* Main Image */}
             <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, height: 300 }}>
                <Image 
                    src={room.images[0]} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    height={300}
                    width="100%"
                />
            </div>
            {/* Thumbnails */}
            <Row gutter={[16, 16]}>
                {[1, 2, 3].map((idx) => (
                    <Col span={8} key={idx}>
                        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 80 }}>
                            <Image 
                                src={room.images[idx] || room.images[0]} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                height={80}
                                preview={idx !== 3} // Only preview normal ones
                            />
                            {/* The +5 Overlay logic */}
                            {idx === 3 && (
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

        {/* 4. Right Column: Details */}
        <Col xs={24} lg={14}>
            <Row gutter={[24, 24]}>
                <InfoItem label="Room Type" value={room.roomType} />
                <InfoItem label="Maximum Occupancy" value={room.occupancy} />
                
                <InfoItem label="Price" value={`₹${room.price} /-`} />
                <InfoItem label="Number Of Rooms" value={room.count} />
                
                <InfoItem label="Bed" value={room.bed} />
                <InfoItem label="Bathroom" value={room.bathroom} />
                
                <InfoItem label="Room Size" value={`${room.size} sq.feet`} />
                <InfoItem label="AC/Non AC" value={room.acType} />
            </Row>

            <div style={{ marginTop: 32 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
                <Paragraph style={{ marginTop: 4, color: token.colorTextHeading }}>
                    {room.description}
                </Paragraph>
            </div>
        </Col>
      </Row>

      {/* 5. Amenities Section */}
      <div style={{ marginTop: 40 }}>
        <Title level={4} style={{ marginBottom: 16, fontSize: 18, color: '#555' }}>Amenities</Title>
        <Space wrap size={[16, 16]}>
            {room.amenities.map((item, index) => (
                <div 
                    key={index}
                    style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '8px 20px', 
                        borderRadius: 20, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 500
                    }}
                >
                    {getAmenityIcon(item.replace(" ", "").toLowerCase())}
                    {item}
                </div>
            ))}
        </Space>
      </div>

      {/* 6. Hourly Booking Section */}
      <div style={{ marginTop: 30 }}>
         <Title level={4} style={{ marginBottom: 16, fontSize: 18, color: '#555' }}>Hourly Booking</Title>
         <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
             {room.hourlyRates.map((rate, index) => (
                 <div 
                    key={index}
                    style={{ 
                        border: '1px solid #eee', 
                        borderRadius: 8, 
                        width: 140, 
                        textAlign: 'center',
                        overflow: 'hidden'
                    }}
                 >
                     {/* Top Price Part */}
                     <div style={{ padding: '12px 0', backgroundColor: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                        ₹ {rate.price}/-
                     </div>
                     {/* Bottom Time Part */}
                     <div style={{ padding: '8px 0', backgroundColor: '#e6e8eb', color: '#555', fontSize: 13 }}>
                        {rate.time}
                     </div>
                 </div>
             ))}
         </div>
      </div>

    </div>
  );
}

// Reusable Component for Key-Value pairs
const InfoItem = ({ label, value }) => (
    <Col span={12}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>{label}</Text>
            <Text strong style={{ fontSize: 15 }}>{value}</Text>
        </div>
    </Col>
);

export default RoomDetails;