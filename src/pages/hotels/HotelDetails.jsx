import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Typography, Button, Spin, Breadcrumb, Tabs, Table, Tag, Card } from "antd";
import { HomeOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import HourlyOperations from "./HourlyOperations";

const { Title } = Typography;
const { TabPane } = Tabs;

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get(`property/hotels/${id}/`);
        setHotel(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  if (!hotel) return <div>Hotel not found</div>;

  // Columns for the Room Category Table
  const typeColumns = [
    { title: "Category", dataIndex: "name", key: "name" },
    { title: "Inventory", dataIndex: "total_inventory", key: "total_inventory" },
    { title: "Nightly Price", dataIndex: "base_price_nightly", render: (p) => `₹${p}` },
    { 
      title: "Hourly Enabled", 
      dataIndex: "is_hourly_enabled", 
      render: (enabled) => <Tag color={enabled ? "green" : "red"}>{enabled ? "YES" : "NO"}</Tag> 
    },
  ];

  const physicalRoomColumns = [
    { title: "Room No", dataIndex: "room_number", key: "room_number" },
    { title: "Floor", dataIndex: "floor_number", key: "floor_number" },
    { title: "Status", dataIndex: "current_status", key: "current_status" },
    { title: "Active", dataIndex: "is_active", key: "is_active", render: (active) => <Tag color={active ? "green" : "red"}>{active ? "YES" : "NO"}</Tag> },


  ]
  console.log(hotel);
  
  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb items={[{ href: '/hotels', title: 'Hotels' }, { title: hotel.name }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{hotel.name}</Title>
          <Tag color={hotel.is_hourly_enabled ? "blue" : "default"}>
             Hotel Master Switch: {hotel.is_hourly_enabled ? "HOURLY ON" : "HOURLY OFF"}
          </Tag>
        </div>
        <Button onClick={() => navigate(`/hotels/${id}/edit`)}>Edit Hotel</Button>
      </div>

      <Tabs defaultActiveKey="1">
        
        {/* TAB 1: OPERATIONS (NEW) */}
        <TabPane tab="Live Operations" key="1">
           <Row gutter={24}>
             <Col xs={24} md={12}>
                <HourlyOperations hotelId={id} />
             </Col>
             <Col xs={24} md={12}>
                {/* You can put a summary of today's hourly bookings here later */}
                <Card title="Quick Stats">
                   <p>Hourly Guests Today: 0</p>
                   <p>Revenue Today: ₹0</p>
                </Card>
             </Col>
           </Row>
        </TabPane>

        {/* TAB 2: ROOM CATEGORIES (Moved) */}
        <TabPane tab="Room Categories" key="2">
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/hotels/${id}/add-room-type`)}>
              Add Category
            </Button>
          </div>
          <Table 
            dataSource={hotel.room_types} 
            columns={typeColumns} 
            rowKey="id" 
            pagination={false} 
          />
        </TabPane>

        {/* TAB 3: PHYSICAL ROOMS (Moved) */}
        <TabPane tab="Physical Rooms" key="3">
           <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/hotels/${id}/add-physical-room`)}>
              Add Physical Room
            </Button>
          </div>
          {/* You would fetch and list physical rooms here. For now, referencing the counts in Tab 1 is often enough for overview */}
          <div style={{ padding: 20, background: '#f5f5f5', textAlign: 'center' }}>
            <Table 
            dataSource={hotel.rooms} 
            columns={physicalRoomColumns} 
            rowKey="id" 
            pagination={false} 
          />
          </div>
        </TabPane>

      </Tabs>
    </div>
  );
}

export default HotelDetails;