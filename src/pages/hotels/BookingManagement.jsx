import React, { useState, useEffect } from "react";
import { 
  Table, Button, Tag, Tabs, Modal, Select, message, 
  Card, Popconfirm, Tooltip, Badge, Form, DatePicker, Input 
} from "antd";
import { 
  LoginOutlined, LogoutOutlined, CloseCircleOutlined, 
  HomeOutlined, UserOutlined, PlusOutlined 
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { TabPane } = Tabs;
const { Option } = Select;

function BookingManagement() {
  const { id } = useParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= WALK-IN STATE ================= */
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [walkInForm] = Form.useForm();

  /* ================= CHECK-IN STATE ================= */
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // useEffect(() => {
  //   fetchBookings();
  //   fetchRoomTypes();
    
  //   const interval = setInterval(() => {
  //     fetchBookings();
  //   }, 5000);
    
  //   return () => clearInterval(interval);

  // }, [id]);
  useEffect(() => {
    let interval = null;

    const startPolling = () => {
      if (!interval) {
        fetchBookings();
        interval = setInterval(fetchBookings, 5000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start immediately if visible
    if (document.visibilityState === "visible") {
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);


  /* ================= API CALLS ================= */

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`property/hotels/${id}/bookings/`);
      setBookings(res.data);
    } catch {
      message.error("Failed to load bookings");
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

  /* ================= WALK-IN SUBMIT ================= */

  const handleWalkIn = async (values) => {
    try {
      const payload = {
        hotel_id: id,
        room_type_id: values.room_type_id,
        user_uuid: "00000000-0000-0000-0000-000000000000",
        check_in: values.dates[0].toISOString(),
        check_out: values.dates[1].toISOString(),
        booking_type: values.booking_type,
        is_walk_in: true
      };

      await api.post(`property/bookings/create/`, payload);
      message.success("Walk-in Booking Confirmed!");
      setIsWalkInModalOpen(false);
      walkInForm.resetFields();
      fetchBookings();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("No rooms available for this time slot!");
      } else {
        message.error("Booking failed");
      }
    }
  };

  /* ================= CHECK-IN LOGIC ================= */

  const openCheckInModal = async (booking) => {
    setSelectedBooking(booking);
    setIsCheckInModalOpen(true);
    setAvailableRooms([]);
    setAssignLoading(true);

    try {
      const res = await api.get(
        `property/bookings/${booking.id}/available-rooms/`
      );
      setAvailableRooms(res.data);
    } catch {
      message.error("Could not fetch available rooms");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!selectedRoomId) {
      message.error("Please select a room number");
      return;
    }

    try {
      await api.post(
        `property/bookings/${selectedBooking.id}/action/`,
        { action: "CHECK_IN", room_id: selectedRoomId }
      );
      message.success("Guest Checked In Successfully");
      setIsCheckInModalOpen(false);
      setSelectedRoomId(null);
      fetchBookings();
    } catch {
      message.error("Check-in failed");
    }
  };

  const handleAction = async (bookingId, action) => {
    try {
      await api.post(
        `property/bookings/${bookingId}/action/`,
        { action }
      );
      message.success(`Booking ${action} successful`);
      fetchBookings();
    } catch {
      message.error("Action failed");
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      title: "Guest / Ref",
      dataIndex: "booking_reference",
      render: (ref) => (
        <div>
          <strong>{ref}</strong>
          <div style={{ fontSize: 12, color: "#888" }}>
            <UserOutlined /> Guest
          </div>
        </div>
      )
    },
    {
      title: "Type",
      dataIndex: "booking_type",
      render: (type) => (
        <Tag color={type === "HOURLY" ? "purple" : "blue"}>
          {type}
        </Tag>
      )
    },
    {
      title: "Category",
      dataIndex: ["room_type", "name"]
    },
    {
      title: "Dates",
      render: (_, r) => (
        <div>
          <div>In: {dayjs(r.scheduled_check_in).format("DD MMM HH:mm")}</div>
          <div>Out: {dayjs(r.scheduled_check_out).format("DD MMM HH:mm")}</div>
        </div>
      )
    },
    {
      title: "Room",
      dataIndex: "assigned_room",
      render: (room) =>
        room ? (
          <Tag color="geekblue">{room.room_number}</Tag>
        ) : (
          <span style={{ color: "#999" }}>Unassigned</span>
        )
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        let color = "default";
        if (status === "CONFIRMED") color = "green";
        if (status === "CHECKED_IN") color = "gold";
        if (status === "CANCELLED") color = "red";
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: "Action",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          {r.status === "CONFIRMED" && (
            <Button
              type="primary"
              size="small"
              icon={<LoginOutlined />}
              onClick={() => openCheckInModal(r)}
            >
              Check In
            </Button>
          )}

          {r.status === "CHECKED_IN" && (
            <Popconfirm
              title="Confirm Check Out?"
              onConfirm={() => handleAction(r.id, "CHECK_OUT")}
            >
              <Button size="small" icon={<LogoutOutlined />}>
                Check Out
              </Button>
            </Popconfirm>
          )}

          {r.status === "CONFIRMED" && (
            <Popconfirm
              title="Cancel Booking?"
              onConfirm={() => handleAction(r.id, "CANCEL")}
            >
              <Button danger size="small" icon={<CloseCircleOutlined />} />
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const checkedIn = bookings.filter(b => b.status === "CHECKED_IN");
  const history = bookings.filter(b =>
    ["CHECKED_OUT", "CANCELLED"].includes(b.status)
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Booking Management"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsWalkInModalOpen(true)}
          >
            New Walk-in
          </Button>
        }
      />

      <Card bordered={false}>
        <Tabs defaultActiveKey="1">
          <TabPane tab={`Upcoming (${confirmed.length})`} key="1">
            <Table columns={columns} dataSource={confirmed} rowKey="id" />
          </TabPane>

          <TabPane tab={`Checked In (${checkedIn.length})`} key="2">
            <Table columns={columns} dataSource={checkedIn} rowKey="id" />
          </TabPane>

          <TabPane tab="History" key="3">
            <Table columns={columns} dataSource={history} rowKey="id" />
          </TabPane>
        </Tabs>
      </Card>

      {/* ================= WALK-IN MODAL ================= */}
      <Modal
        title="New Walk-in Booking"
        open={isWalkInModalOpen}
        onCancel={() => setIsWalkInModalOpen(false)}
        footer={null}
      >
        <Form form={walkInForm} layout="vertical" onFinish={handleWalkIn}>
          <Form.Item label="Guest Name" name="guest_name">
            <Input placeholder="Enter guest name" />
          </Form.Item>

          <Form.Item label="Booking Type" name="booking_type" initialValue="NIGHTLY">
            <Select onChange={() => walkInForm.setFieldsValue({ dates: null })}>
              <Option value="NIGHTLY">Nightly</Option>
              <Option value="HOURLY">Hourly</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Room Category" name="room_type_id" rules={[{ required: true }]}>
            <Select>
              {roomTypes.map(rt => (
                <Option key={rt.id} value={rt.id}>
                  {rt.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Duration" name="dates" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Confirm Booking
          </Button>
        </Form>
      </Modal>

      {/* ================= CHECK-IN MODAL ================= */}
      <Modal
        title={<><HomeOutlined /> Check In Guest</>}
        open={isCheckInModalOpen}
        onCancel={() => setIsCheckInModalOpen(false)}
        onOk={handleCheckInSubmit}
        okText="Confirm & Check In"
        confirmLoading={assignLoading}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Select room"
          onChange={setSelectedRoomId}
        >
          {availableRooms.map(room => (
            <Option key={room.id} value={room.id}>
              Room {room.room_number}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default BookingManagement;
