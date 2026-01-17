import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb, Button, Spin, Modal, Form, Input, InputNumber, message, Select, Tag } from "antd";
import { HomeOutlined, PlusOutlined, EditOutlined, DeleteOutlined, WifiOutlined, DesktopOutlined, RocketOutlined, ThunderboltOutlined, VideoCameraOutlined, CoffeeOutlined, StarOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import "./CategoryDetails.css";

const { Option } = Select;
const CAT_IMAGE = "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop";

const iconMap = {
    wifi: <WifiOutlined />,
    television: <DesktopOutlined />,
    tv: <DesktopOutlined />,
    pool: <RocketOutlined />,
    "swimming pool": <RocketOutlined />,
    fitness: <ThunderboltOutlined />,
    gym: <ThunderboltOutlined />,
    cctv: <VideoCameraOutlined />,
    "minibar": <CoffeeOutlined />,
    "mini bar": <CoffeeOutlined />
};

const getAmenityIcon = (name) => {
    const key = name?.toLowerCase();
    return iconMap[key] || null;
};

function CategoryDetails() {
    const { id, categoryId } = useParams(); // Hotel ID, Category ID
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [hotelName, setHotelName] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    console.log(rooms);

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [addLoading, setAddLoading] = useState(false);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    useEffect(() => {
        fetchDetails();
    }, [categoryId]);

    const handleDelete = async () => {
        try {
            await api.delete(`property/room-types/${categoryId}/`);
            message.success("Category deleted successfully");
            navigate(`/hotels/${id}`);
        } catch (err) {
            console.error(err);
            message.error("Failed to delete category");
        }
    };
    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Fetch Category Details
            const res = await api.get(`property/room-types/${categoryId}/`);
            setCategory(res.data);

            // Fetch Hotel Details for Breadcrumb/Title if needed, or rely on other context
            // For now, let's assume we can get hotel name from an API or just use a placeholder if not in category response
            if (res.data.hotel_name) {
                setHotelName(res.data.hotel_name);

            } else {
                try {
                    const hotelRes = await api.get(`property/hotels/${id}/`);
                    setHotelName(hotelRes.data.name);
                    const allRooms = hotelRes.data.rooms || [];
                    const filteredRooms = allRooms.filter(r => String(r.room_type) === String(categoryId));
                    setRooms(filteredRooms);
                } catch {
                    setHotelName("Hotel");
                }
            }

        } catch (err) {
            console.error(err);
            message.error("Failed to load category details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoom = async (values) => {
        setAddLoading(true);
        try {
            const payload = {
                hotel: id,
                room_type: categoryId,
                room_number: values.room_number,
                floor_number: values.floor_number,
                is_active: true,
                current_status: 'CLEAN'
            };

            await api.post(`property/hotels/${id}/rooms/`, payload);
            message.success("Room Added Successfully");
            setIsModalVisible(false);
            form.resetFields();
            fetchDetails(); // Refresh list
        } catch (error) {
            console.error("Add room error:", error);
            message.error("Failed to add room");
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteRoom = (roomId) => {
        Modal.confirm({
            title: "Delete Room?",
            content: "Are you sure you want to delete this physical room? This action cannot be undone.",
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`property/rooms/${roomId}/`);
                    message.success("Room deleted successfully");
                    fetchDetails(); // Refresh list
                } catch (err) {
                    console.error("Delete room error:", err);
                    message.error("Failed to delete room");
                }
            }
        });
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        editForm.setFieldsValue({
            room_number: room.room_number,
            floor_number: room.floor_number,
            current_status: room.current_status
        });
        setIsEditModalVisible(true);
    };

    const handleUpdateRoom = async (values) => {
        setEditLoading(true);
        try {
            const payload = {
                hotel: id,
                room_type: categoryId,
                room_number: values.room_number,
                floor_number: values.floor_number,
                current_status: values.current_status,
                is_active: true
            };

            await api.put(`property/rooms/${editingRoom.id}/`, payload);
            message.success("Room Updated Successfully");
            setIsEditModalVisible(false);
            setEditingRoom(null);
            fetchDetails(); // Refresh list
        } catch (error) {
            console.error("Update room error:", error);
            message.error("Failed to update room");
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
    if (!category) return <div>Category not found</div>;

    // const physicalRooms = category.physical_rooms || []; // Using 'rooms' state now as per user change

    return (
        <div className="category-details-container">
            {/* Breadcrumb */}
            <div className="cd-breadcrumb">
                <Breadcrumb
                    items={[
                        { href: '/dashboard', title: <><HomeOutlined /> Home</> },
                        { href: '/hotels', title: 'Hotel Management' },
                        { href: `/hotels/${id}`, title: hotelName },
                        { title: category.name }
                    ]}
                />
            </div>

            {/* Header */}
            <div className="cd-header">
                <h1 className="cd-title">{category.name}</h1>
                <div className="cd-actions">
                    <EditOutlined
                        className="cd-action-icon"
                        title="Edit Category"
                        onClick={() => navigate(`/hotels/${id}/room-types/${categoryId}/edit`)}
                    />
                    <DeleteOutlined
                        className="cd-action-icon"
                        style={{ color: '#ff4d4f' }}
                        title="Delete Category"
                        onClick={handleDelete}
                    />
                </div>
            </div>

            {/* Main Info Card (Hero) */}
            <div className="cd-main-card">
                <div className="cd-layout-row">
                    {/* Left: Image */}
                    <div className="cd-gallery">
                        <img src={category.image || CAT_IMAGE} alt={category.name} className="cd-main-image" />
                    </div>

                    {/* Right: Details */}
                    <div className="cd-info">
                        <div className="cd-info-grid">
                            <div className="cd-info-item">
                                <span className="cd-label">Name</span>
                                <span className="cd-value">{category.name}</span>
                            </div>
                            <div className="cd-info-item">
                                <span className="cd-label">Nightly Rate</span>
                                <span className="cd-value">₹{category.base_price_nightly}</span>
                            </div>
                            <div className="cd-info-item">
                                <span className="cd-label">Hourly Enabled</span>
                                <span className="cd-value">
                                    <Tag color={category.is_hourly_enabled ? "green" : "red"}>
                                        {category.is_hourly_enabled ? "YES" : "NO"}
                                    </Tag>
                                </span>
                            </div>
                            <div className="cd-info-item">
                                <span className="cd-label">Total Inventory</span>
                                <span className="cd-value">{category.total_inventory}</span>
                            </div>
                            <div className="cd-info-item">
                                <span className="cd-label">Max Adults</span>
                                <span className="cd-value">{category.max_adults}</span>
                            </div>
                            <div className="cd-info-item">
                                <span className="cd-label">Max Children</span>
                                <span className="cd-value">{category.max_children}</span>
                            </div>
                        </div>

                        <div className="cd-info-item">
                            <span className="cd-label">Description</span>
                            <p className="cd-description">{category.description}</p>
                        </div>
                    </div>
                </div>

                {/* Amenities Section */}
                {category.amenities && category.amenities.length > 0 && (
                    <div className="cd-amenities-section">
                        <h3 className="cd-amenities-header">Amenities</h3>
                        <div className="cd-amenities-grid">
                            {category.amenities.map(amenity => {
                                const icon = getAmenityIcon(amenity.name);
                                return (
                                    <div key={amenity.id} className="cd-amenity-item">
                                        {icon && (
                                            <span className="cd-amenity-icon">
                                                {icon}
                                            </span>
                                        )}
                                        <span>{amenity.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Physical Rooms Section */}
            <div className="cd-section-header">
                <h2 className="cd-section-title">Physical Rooms</h2>
                <Button
                    className="cd-add-btn"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                >
                    Add Room
                </Button>
            </div>

            {/* Rooms List */}
            <div className="cd-rooms-grid">
                {rooms.length > 0 ? (
                    rooms.map(room => (
                        <div key={room.id} className="cd-room-card" style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <EditOutlined
                                        style={{ color: '#1890ff', cursor: 'pointer' }}
                                        onClick={() => handleEditRoom(room)}
                                    />
                                    <DeleteOutlined
                                        style={{ color: '#ff4d4f', cursor: 'pointer' }}
                                        onClick={() => handleDeleteRoom(room.id)}
                                    />
                                </div>
                            </div>
                            <div className="cd-room-header">
                                <span className="cd-room-number">{room.room_number}</span>
                            </div>
                            <span className={`cd-room-status status-${room.current_status?.toLowerCase() || 'clean'}`}>
                                {room.current_status || 'CLEAN'}
                            </span>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: 12 }}>
                                Floor: {room.floor_number}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                        No physical rooms added yet.
                    </div>
                )}
            </div>

            {/* Add Room Modal */}
            <Modal
                title={<span style={{ fontWeight: 600, fontSize: '18px' }}>Add Physical Room</span>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={addLoading}
                okText="Add Room"
                okButtonProps={{ style: { backgroundColor: '#1a1a1a', borderRadius: '20px' } }}
                cancelButtonProps={{ style: { borderRadius: '20px' } }}
            >
                <Form form={form} layout="vertical" onFinish={handleAddRoom} style={{ marginTop: 24 }}>
                    <Form.Item label="Room Number / Name" name="room_number" rules={[{ required: true, message: 'Please enter room identifier' }]}>
                        <Input placeholder="e.g. 101 or A-01" style={{ borderRadius: '8px' }} />
                    </Form.Item>
                    <Form.Item label="Floor Number" name="floor_number" initialValue={1}>
                        <InputNumber style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Room Modal */}
            <Modal
                title={<span style={{ fontWeight: 600, fontSize: '18px' }}>Edit Room Details</span>}
                open={isEditModalVisible}
                onCancel={() => { setIsEditModalVisible(false); setEditingRoom(null); }}
                onOk={() => editForm.submit()}
                confirmLoading={editLoading}
                okText="Update Room"
                okButtonProps={{ style: { backgroundColor: '#1a1a1a', borderRadius: '20px' } }}
                cancelButtonProps={{ style: { borderRadius: '20px' } }}
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateRoom} style={{ marginTop: 24 }}>
                    <Form.Item label="Room Number / Name" name="room_number" rules={[{ required: true, message: 'Please enter room identifier' }]}>
                        <Input placeholder="e.g. 101 or A-01" style={{ borderRadius: '8px' }} />
                    </Form.Item>
                    <Form.Item label="Floor Number" name="floor_number" initialValue={1}>
                        <InputNumber style={{ width: '100%', borderRadius: '8px' }} />
                    </Form.Item>
                    {isEditModalVisible && (
                        <Form.Item label="Current Status" name="current_status" initialValue="CLEAN">
                            <Select style={{ borderRadius: '8px' }}>
                                <Option value="CLEAN">Clean</Option>
                                <Option value="DIRTY">Dirty</Option>
                                <Option value="MAINTENANCE">Maintenance</Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>

        </div>
    );
}

export default CategoryDetails;
