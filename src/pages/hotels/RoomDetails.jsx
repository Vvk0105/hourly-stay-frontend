import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Row, Col, Typography, Breadcrumb, Image, Button, Space, Spin, message, theme, Card, Tag, Modal, Select, Form, Input, InputNumber, Statistic
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
    RocketOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    StopOutlined
} from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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
    const [statusLoading, setStatusLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch Data
    useEffect(() => {
        fetchRoomDetails();
    }, [id, roomId]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`property/rooms/${roomId}/`);
            // Enrich data with related room type info if needed
            // Assuming backend returns nested room_type object or we fetch it similarly
            // For now, based on serializer: RoomSerializer has 'room_type' ID. 
            // We might need to fetch RoomType details separately if serializer is flat.
            // Let's assume RoomSerializer -> room_type is ID. 
            // Ideally prompt backend to nest it or fetch RT separately.
            // Wait! The user said "Add all crud operations".
            // The current RoomSerializer returns IDs. I should fix serializer or fetch RT here.
            // I will do a quick fetch of RT to display name.

            const roomData = res.data;

            // Fetch Room Type to get Name/Price/Amenities
            const rtRes = await api.get(`property/room-types/${roomData.room_type}/`);
            const rtData = rtRes.data;

            setRoom({
                ...roomData,
                roomTypeName: rtData.name,
                price: rtData.base_price_nightly,
                // Mocking amenities/images for now as they aren't in model yet (Plan says "Room Categories" crud coming)
                amenities: ["Wifi", "Television", "AC"],
                description: rtData.description,
                images: [
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"
                ],
                // Hourly Config
                hourlyRates: rtData.is_hourly_enabled && rtData.hourly_config ? [
                    { time: `${rtData.hourly_config.min_duration_hours} Hours`, price: rtData.hourly_config.base_price }
                ] : []
            });

        } catch (error) {
            console.error(error);
            message.error("Failed to load room details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            setStatusLoading(true);
            await api.patch(`property/rooms/${roomId}/status/`, { status: newStatus });
            message.success("Status updated!");
            fetchRoomDetails();
        } catch (e) {
            message.error("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Are you sure you want to delete this room?",
            content: "This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            onOk: async () => {
                try {
                    await api.delete(`property/rooms/${roomId}/`);
                    message.success("Room deleted successfully");
                    navigate(`/hotels/${id}`);
                } catch (e) {
                    message.error("Failed to delete room");
                }
            }
        });
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}><Spin size="large" /></div>;
    if (!room) return <div>Room not found</div>;

    const getStatusColor = (s) => {
        if (s === 'CLEAN') return 'green';
        if (s === 'DIRTY') return 'orange';
        return 'red';
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* 1. Breadcrumb */}
            <Breadcrumb
                items={[
                    { href: '/dashboard', title: <HomeOutlined /> },
                    { href: '/hotels', title: 'Hotel Management' },
                    { href: `/hotels/${id}`, title: "Hotel" },
                    { title: `Room ${room.room_number}` },
                ]}
                style={{ marginBottom: 16 }}
            />

            {/* 2. Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Room {room.room_number} <Tag color={getStatusColor(room.current_status)}>{room.current_status}</Tag>
                    </Title>
                    <Text type="secondary">{room.roomTypeName}</Text>
                </div>
                <Space>
                    <Select
                        value={room.current_status}
                        style={{ width: 140 }}
                        onChange={handleStatusChange}
                        loading={statusLoading}
                    >
                        <Option value="CLEAN"><CheckCircleOutlined style={{ color: 'green' }} /> Clean</Option>
                        <Option value="DIRTY"><WarningOutlined style={{ color: 'orange' }} /> Dirty</Option>
                        <Option value="MAINTENANCE"><StopOutlined style={{ color: 'red' }} /> Maintenance</Option>
                    </Select>

                    <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>Edit</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete} />
                </Space>
            </div>

            <Row gutter={[32, 32]}>
                <Col xs={24} lg={10}>
                    <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, height: 300 }}>
                        <Image
                            src={room.images[0]}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            height={300}
                            width="100%"
                        />
                    </div>
                </Col>

                <Col xs={24} lg={14}>
                    <Row gutter={[24, 24]}>
                        <InfoItem label="Room Type" value={room.roomTypeName} />
                        <InfoItem label="Floor" value={room.floor_number} />
                        <InfoItem label="Status" value={room.current_status} />
                        <InfoItem label="Nightly Price" value={`₹${room.price}`} />
                    </Row>

                    <div style={{ marginTop: 32 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
                        <Paragraph style={{ marginTop: 4, color: token.colorTextHeading }}>
                            {room.description || "No description available."}
                        </Paragraph>
                    </div>
                </Col>
            </Row>

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

            {room.hourlyRates.length > 0 && (
                <div style={{ marginTop: 30 }}>
                    <Title level={4} style={{ marginBottom: 16, fontSize: 18, color: '#555' }}>Hourly Config</Title>
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
                                <div style={{ padding: '12px 0', backgroundColor: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                                    ₹ {rate.price}/-
                                </div>
                                <div style={{ padding: '8px 0', backgroundColor: '#e6e8eb', color: '#555', fontSize: 13 }}>
                                    Base: {rate.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <RoomEditModal 
                open={isEditModalOpen} 
                onCancel={() => setIsEditModalOpen(false)}
                room={room}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    fetchRoomDetails();
                }}
            />
        </div>
    );
}




// Sub-component for Edit Modal
const RoomEditModal = ({ open, onCancel, room, onSuccess }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (room) {
            form.setFieldsValue({
                room_number: room.room_number,
                floor_number: room.floor_number,
            });
        }
    }, [room, open]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            await api.put(`property/rooms/${room.id}/`, {
                ...values,
            });
            message.success("Room updated successfully");
            onSuccess();
        } catch (e) {
            message.error("Update failed");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal title="Edit Room Details" open={open} onOk={handleOk} onCancel={onCancel} confirmLoading={submitting}>
            <Form form={form} layout="vertical">
                <Form.Item label="Room Number" name="room_number" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Floor Number" name="floor_number" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>
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