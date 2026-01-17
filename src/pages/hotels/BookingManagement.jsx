import React, { useState, useEffect } from "react";
import {
  Table, Button, Tag, Tabs, Modal, Select, message,
  Card, Popconfirm, Tooltip, Badge, Form, DatePicker, Input, Switch, Row, Col, Typography
} from "antd";
import {
  LoginOutlined, LogoutOutlined, CloseCircleOutlined,
  HomeOutlined, UserOutlined, PlusOutlined, ClockCircleOutlined, SearchOutlined, CalendarOutlined
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

function BookingManagement() {
  const { id } = useParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Hourly Mode State
  const [hourlyMode, setHourlyMode] = useState(false);
  const [showHourlyConfigModal, setShowHourlyConfigModal] = useState(false);
  const [hourlyConfigType, setHourlyConfigType] = useState('AUTO'); // 'AUTO' | 'CUSTOM'

  // New Booking Modal State
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('NIGHTLY'); // 'NIGHTLY' | 'HOURLY'
  const [newBookingForm] = Form.useForm();

  // Data State
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchRoomTypes();
    fetchRooms();
  }, [id]);

  /* ================= API CALLS ================= */
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`property/hotels/${id}/bookings/`);
      setBookings(res.data);
    } catch {
      // message.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get(`property/hotels/${id}/room-types/`);
      setRoomTypes(res.data);
    } catch {
      console.error("Failed to load room types");
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get(`property/hotels/${id}/rooms/`);
      setRooms(res.data);
    } catch {
      console.error("Failed to load rooms");
    }
  }

  /* ================= HANDLERS ================= */
  const handleHourlySwitch = (checked) => {
    if (checked) {
      setShowHourlyConfigModal(true);
    } else {
      setHourlyMode(false);
      message.info("Hourly Booking Disabled");
    }
  };

  const confirmHourlyConfig = () => {
    setHourlyMode(true);
    setShowHourlyConfigModal(false);
    message.success(`Hourly Booking Enabled (${hourlyConfigType === 'AUTO' ? 'Auto Mode' : 'Custom Schedule'})`);
  };

  const handleNewBooking = async (values) => {
    try {
      const payload = {
        hotel_id: id,
        room_type_id: values.room_type_id,
        user_uuid: "00000000-0000-0000-0000-000000000000", // Default/Guest UUID
        booking_type: bookingType,
        is_walk_in: true,
        guest_name: values.guest_name
      };

      if (bookingType === 'NIGHTLY') {
        payload.check_in = values.check_in_date.format('YYYY-MM-DD') + 'T' + values.check_in_time.format('HH:mm:ss');
        payload.check_out = values.check_out_date.format('YYYY-MM-DD') + 'T' + values.check_out_time.format('HH:mm:ss');
      } else {
        // Hourly logic
        payload.check_in = values.check_in_date.format('YYYY-MM-DD') + 'T' + values.check_in_time.format('HH:mm:ss');
        // Calculate checkout based on duration
        const duration = parseInt(values.duration);
        payload.check_out = dayjs(payload.check_in).add(duration, 'hour').toISOString();
      }

      await api.post(`property/bookings/create/`, payload);
      message.success("Booking Created Successfully!");
      setIsNewBookingModalOpen(false);
      newBookingForm.resetFields();
      fetchBookings();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("No rooms available!");
      } else {
        message.error("Booking failed");
      }
    }
  };

  /* ================= COLUMNS ================= */
  const columns = [
    {
      title: "Guest / Ref",
      dataIndex: "booking_reference",
      render: (ref, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{record.guest_name || "Guest"}</span>
          <span style={{ color: "#888", fontSize: '12px' }}>{ref}</span>
        </div>
      )
    },
    {
      title: "Type",
      dataIndex: "booking_type",
      render: (type) => (
        <Tag color={type === "HOURLY" ? "purple" : "geekblue"} style={{ borderRadius: 4 }}>
          {type}
        </Tag>
      )
    },
    {
      title: "Category",
      dataIndex: ["room_type", "name"],
      render: (text) => text || "-"
    },
    {
      title: "Dates",
      render: (_, r) => (
        <div style={{ fontSize: '13px' }}>
          <div>In: <span style={{ fontWeight: 500 }}>{dayjs(r.scheduled_check_in).format("DD MMM, HH:mm")}</span></div>
          <div>Out: <span style={{ fontWeight: 500 }}>{dayjs(r.scheduled_check_out).format("DD MMM, HH:mm")}</span></div>
        </div>
      )
    },
    {
      title: "Rooms",
      dataIndex: "assigned_room",
      render: (room) => room ? <Tag>{room.room_number}</Tag> : <span style={{ color: '#aaa' }}>-</span>
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        let color = "default";
        if (status === "CONFIRMED") color = "success";
        if (status === "CHECKED_IN") color = "warning"; // "Checked In" usually yellow/orange in designs
        if (status === "CANCELLED") color = "error";
        return <Tag color={color} style={{ borderRadius: 12, padding: '0 10px' }}>{status}</Tag>;
      }
    },
    {
      title: "Action",
      key: "action",
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {r.status === 'CONFIRMED' && (
            <Button type="primary" style={{ backgroundColor: '#333', borderColor: '#333' }} size="small" onClick={() => { }}>Check In</Button>
          )}
          {r.status === 'CHECKED_IN' && (
            <Button type="primary" style={{ backgroundColor: '#333', borderColor: '#333' }} size="small" onClick={() => { }}>Check Out</Button>
          )}
          <Button type="text" danger icon={<CloseCircleOutlined />} size="small" />
        </div>
      )
    }
  ];

  /* ================= DATA FILTERING ================= */
  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const checkedIn = bookings.filter(b => b.status === "CHECKED_IN");
  const history = bookings.filter(b => ["CHECKED_OUT", "CANCELLED"].includes(b.status));

  return (
    <div style={{ padding: '24px', backgroundColor: '#F4F7FC', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ color: '#888', marginBottom: 4 }}>Home / Booking Management</div>
          <Title level={3} style={{ margin: 0 }}>Booking Management</Title>
        </div>
        <Button
          type="primary"
          shape="round"
          size="large"
          icon={<PlusOutlined />}
          style={{ backgroundColor: '#fff', color: '#000', border: '1px solid #d9d9d9' }}
          onClick={() => setIsNewBookingModalOpen(true)}
        >
          New Booking
        </Button>
      </div>

      {/* CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        {/* TABS (Custom rendered to match design layout roughly) */}
        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search here..."
            style={{ width: 300, borderRadius: 20 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#555' }}>Hourly Booking</span>
          <Switch checked={hourlyMode} onChange={handleHourlySwitch} />
          <span style={{ color: '#888' }}>{hourlyMode ? 'Active' : 'Inactive'}</span>
        </div>
      </div>


      {/* MAIN CONTENT CARD */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <Tabs
          defaultActiveKey="upcoming"
          tabBarStyle={{ marginBottom: 24 }}
          items={[
            {
              key: 'upcoming',
              label: `Upcoming(${confirmed.length})`,
              children: <Table columns={columns} dataSource={confirmed} rowKey="id" pagination={{ pageSize: 5 }} />
            },
            {
              key: 'checked_in',
              label: `Checked In (${checkedIn.length})`,
              children: <Table columns={columns} dataSource={checkedIn} rowKey="id" />
            },
            {
              key: 'available_rooms',
              label: 'Available Rooms',
              children: (
                <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  {/* Placeholder for Grid View */}
                  <Row gutter={[16, 16]}>
                    {rooms.map(room => (
                      <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                        <Card hoverable cover={<div style={{ height: 120, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HomeOutlined style={{ fontSize: 32, color: '#ccc' }} /></div>}>
                          <Card.Meta title={`Room ${room.room_number}`} description={room.room_type?.name || 'Standard'} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )
            },
            {
              key: 'hourly_stay',
              label: 'Hourly Stay',
              children: (
                <div>
                  {hourlyMode && (
                    <div style={{
                      backgroundColor: '#FFFBE6',
                      border: '1px solid #FFE58F',
                      padding: '12px 16px',
                      borderRadius: 8,
                      marginBottom: 20,
                      color: '#d48806'
                    }}>
                      Hourly Booking is enabled upto {dayjs().add(1, 'year').format('DD MMM YYYY, HH:mm')}
                    </div>
                  )}

                  {/* Mock Hourly Cards */}
                  <Row gutter={[16, 16]}>
                    {[101, 102, 103, 104].map(r => (
                      <Col span={12} key={r}>
                        <Card bordered={true} style={{ borderRadius: 8 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontWeight: 600 }}>Room. {r}</span>
                            <Tag>standard</Tag>
                          </div>
                          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 40 }}>
                            <div style={{ flex: 1, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
                            <div style={{ flex: 2, background: '#d9f7be', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#389e0d', fontWeight: 500 }}>Booked</div>
                            <div style={{ flex: 3, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Free</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#888' }}>
                            <span>9.00pm</span>
                            <span>11.00pm</span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )
            },
            {
              key: 'history',
              label: 'History',
              children: <Table columns={columns} dataSource={history} rowKey="id" />
            }
          ]}
        />
      </Card>

      {/* ================= MODALS ================= */}

      {/* HOURLY CONFIG MODAL */}
      <Modal
        title="Hourly Booking"
        open={showHourlyConfigModal}
        onCancel={() => setShowHourlyConfigModal(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ background: '#f5f5f5', display: 'inline-flex', padding: 4, borderRadius: 30 }}>
            <Button
              shape="round"
              type={hourlyConfigType === 'AUTO' ? 'primary' : 'text'}
              style={hourlyConfigType === 'AUTO' ? { backgroundColor: '#000' } : {}}
              onClick={() => setHourlyConfigType('AUTO')}
            >
              Auto Mode
            </Button>
            <Button
              shape="round"
              type={hourlyConfigType === 'CUSTOM' ? 'primary' : 'text'}
              style={hourlyConfigType === 'CUSTOM' ? { backgroundColor: '#000' } : {}}
              onClick={() => setHourlyConfigType('CUSTOM')}
            >
              Custom Schedule
            </Button>
          </div>
        </div>

        {hourlyConfigType === 'AUTO' ? (
          <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#d48806' }}>Auto Mode</div>
            <Typography.Paragraph style={{ color: '#555', margin: 0 }}>
              Opens availability immediately. Automatically closes at the standard check-out time tomorrow.
            </Typography.Paragraph>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>Start Date</div>
                <DatePicker style={{ width: '100%' }} />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>End Date</div>
                <DatePicker style={{ width: '100%' }} />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>Start Time</div>
                <DatePicker picker="time" format="HH:mm" style={{ width: '100%' }} />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>End Time</div>
                <DatePicker picker="time" format="HH:mm" style={{ width: '100%' }} />
              </Col>
            </Row>
          </div>
        )}

        <Button
          type="primary"
          block
          size="large"
          onClick={confirmHourlyConfig}
          style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 8 }}
        >
          Start Now
        </Button>
      </Modal>

      {/* NEW BOOKING MODAL */}
      <Modal
        title="New Booking"
        open={isNewBookingModalOpen}
        onCancel={() => setIsNewBookingModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={newBookingForm} layout="vertical" onFinish={handleNewBooking} initialValues={{ booking_type: 'NIGHTLY' }}>

          {/* TYPE TOGGLE */}
          {hourlyMode && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ background: '#f5f5f5', display: 'inline-flex', padding: 4, borderRadius: 30 }}>
                <Button
                  shape="round"
                  type={bookingType === 'NIGHTLY' ? 'primary' : 'text'}
                  style={bookingType === 'NIGHTLY' ? { backgroundColor: '#000' } : {}}
                  onClick={() => {
                    setBookingType('NIGHTLY');
                    newBookingForm.setFieldsValue({ booking_type: 'NIGHTLY' });
                  }}
                >
                  Full Day Booking
                </Button>
                <Button
                  shape="round"
                  type={bookingType === 'HOURLY' ? 'primary' : 'text'}
                  style={bookingType === 'HOURLY' ? { backgroundColor: '#000' } : {}}
                  onClick={() => {
                    setBookingType('HOURLY');
                    newBookingForm.setFieldsValue({ booking_type: 'HOURLY' });
                  }}
                >
                  Hourly Booking
                </Button>
              </div>
            </div>
          )}

          <Form.Item name="booking_type" hidden><Input /></Form.Item>

          <Form.Item label="Guest Name / Ref" name="guest_name" rules={[{ required: true }]}>
            <Input placeholder="Name" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={bookingType === 'HOURLY' ? 12 : 12}>
              <Form.Item label="Check In Date" name="check_in_date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%', borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Time" name="check_in_time" rules={[{ required: true }]}>
                <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          {bookingType === 'NIGHTLY' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Check Out Date" name="check_out_date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Time" name="check_out_time" rules={[{ required: true }]}>
                  <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {bookingType === 'HOURLY' && (
            <Form.Item label="Duration" name="duration" rules={[{ required: true }]}>
              <Select style={{ width: '100%', borderRadius: 6 }} placeholder="Select Hours">
                {[3, 4, 6, 12].map(h => (
                  <Option key={h} value={h}>{h} Hours</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category" name="room_type_id" rules={[{ required: true }]}>
                <Select placeholder="Select" style={{ borderRadius: 6 }}>
                  {roomTypes.map(rt => <Option key={rt.id} value={rt.id}>{rt.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Rooms" name="room_id">
                <Select placeholder="Select" style={{ borderRadius: 6 }}>
                  {rooms.filter(r => r.status === 'AVAILABLE').map(r => (
                    <Option key={r.id} value={r.id}>{r.room_number}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ backgroundColor: '#000', borderColor: '#000', borderRadius: 8, marginTop: 12 }}
          >
            Submit
          </Button>

        </Form>
      </Modal>

    </div>
  );
}

export default BookingManagement;
