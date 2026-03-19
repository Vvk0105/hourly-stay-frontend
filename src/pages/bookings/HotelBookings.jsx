import React, { useState, useEffect } from "react";
import useSocketEvent, { SOCKET_EVENTS } from '../../hooks/useSocketEvent';
import {
  Table, Button, Tag, Tabs, Modal, Select, message,
  Card, Popconfirm, Tooltip, Badge, Form, DatePicker, Input
} from "antd";
import {
  LoginOutlined, LogoutOutlined, CloseCircleOutlined,
  HomeOutlined, UserOutlined, PlusOutlined, ExclamationCircleOutlined,
  EyeOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";


const { Option } = Select;

function BookingManagement() {
  const { id } = useParams();
  const navigate = useNavigate();


  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= DATE FILTER STATE ================= */
  const [upcomingDateFilter, setUpcomingDateFilter] = useState(null);
  const [historyDateFilter, setHistoryDateFilter] = useState(null);

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

  /* ================= CANCELLATION STATE ================= */
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [refundPreview, setRefundPreview] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitLoading, setCancelSubmitLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchRoomTypes();
  }, [id]);

  useSocketEvent([SOCKET_EVENTS.BOOKING_UPDATED, SOCKET_EVENTS.PAYMENT_UPDATED], fetchBookings);


  /* ================= API CALLS ================= */

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`booking/hotels/${id}/bookings/`);
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

      await api.post(`booking/bookings/create/`, payload);
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
    setAvailableRooms([]); // Clear previous list
    setSelectedRoomId(null); // Clear previous selection
    setAssignLoading(true);

    try {
      const res = await api.get(
        `booking/bookings/${booking.id}/available-rooms/`
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
        `booking/bookings/${selectedBooking.id}/action/`,
        { action: "CHECK_IN", room_id: selectedRoomId }
      );
      message.success("Guest Checked In Successfully");
      setIsCheckInModalOpen(false);
      setSelectedRoomId(null); // Clear selection
      setAvailableRooms([]); // Clear list
      fetchBookings(); // Refresh main table
    } catch {
      message.error("Check-in failed");
    }
  };

  const handleAction = async (bookingId, action) => {
    try {
      await api.post(
        `booking/bookings/${bookingId}/action/`,
        { action }
      );
      message.success(`Booking ${action} successful`);
      fetchBookings();
    } catch {
      message.error("Action failed");
    }
  };

  /* ================= CANCELLATION LOGIC ================= */
  const openCancelModal = async (booking) => {
    setCancelBooking(booking);
    setIsCancelModalOpen(true);
    setRefundPreview(null);
    setCancelReason("");
    setRefundLoading(true);

    try {
      // Updated endpoint to match backend: /bookings/{id}/refund-preview/
      const res = await api.get(`booking/bookings/${booking.id}/refund-preview/`);
      setRefundPreview(res.data);
    } catch {
      message.error("Could not fetch refund preview");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason) {
      message.error("Cancellation reason is required");
      return;
    }

    setCancelSubmitLoading(true);
    try {
      await api.post(
        `booking/bookings/${cancelBooking.id}/action/`,
        { action: "CANCEL", reason: cancelReason }
      );
      message.success("Booking Cancelled Successfully");
      setIsCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      message.error(err.response?.data?.error || "Cancellation failed");
    } finally {
      setCancelSubmitLoading(false);
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
        const statusConfigs = {
          'CONFIRMED': { color: 'green', label: 'Confirmed' },
          'CHECKED_IN': { color: 'gold', label: 'Checked In' },
          'CHECKED_OUT': { color: 'blue', label: 'Checked Out' },
          'CANCELLED': { color: 'red', label: 'Cancelled' },
          'PENDING_PAYMENT': { color: 'orange', label: 'Pending' },
          'FAILED': { color: 'volcano', label: 'Failed' },
        };
        const config = statusConfigs[status] || { color: 'default', label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: "Refund",
      key: "refund",
      render: (_, r) => {
        if (!r.refund_request) return null;
        const { refund_amount, status } = r.refund_request;
        return (
          <Tooltip title={`Reason: ${r.refund_request.reason}`}>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ fontWeight: 500, color: status === 'COMPLETED' ? '#52c41a' : '#faad14' }}>
                ₹{refund_amount}
              </div>
              <Tag color={status === 'COMPLETED' ? 'green' : 'orange'} style={{ fontSize: '10px', margin: 0 }}>
                {status}
              </Tag>
            </div>
          </Tooltip>
        );
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
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => openCancelModal(r)}
            />
          )}

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/bookings/${r.id}`)}
          />
        </div>
      )
    }
  ];


  /* ================= FILTERING LOGIC ================= */
  const filterByDateRange = (bookingsList, dateRange) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return bookingsList;

    const [startDate, endDate] = dateRange;
    return bookingsList.filter(booking => {
      const checkInDate = dayjs(booking.scheduled_check_in);
      return checkInDate.isSameOrAfter(startDate, 'day') && checkInDate.isSameOrBefore(endDate, 'day');
    });
  };

  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const checkedIn = bookings.filter(b => b.status === "CHECKED_IN");
  const history = bookings.filter(b =>
    ["CHECKED_OUT", "CANCELLED"].includes(b.status)
  );

  // Apply date filters
  const filteredConfirmed = filterByDateRange(confirmed, upcomingDateFilter);
  const filteredHistory = filterByDateRange(history, historyDateFilter);

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

      <Card variant="borderless" className="booking-card-glass">
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: `Upcoming (${confirmed.length})`,
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <DatePicker.RangePicker
                      value={upcomingDateFilter}
                      onChange={setUpcomingDateFilter}
                      format="DD MMM YYYY"
                      placeholder={['Start Date', 'End Date']}
                      style={{ width: 300 }}
                    />
                    {upcomingDateFilter && (
                      <Button onClick={() => setUpcomingDateFilter(null)} size="small">
                        Clear Filter
                      </Button>
                    )}
                    <span style={{ color: '#888', fontSize: 12 }}>
                      Showing {filteredConfirmed.length} of {confirmed.length} bookings
                    </span>
                  </div>
                  <Table columns={columns} dataSource={filteredConfirmed} rowKey="id" />
                </>
              )
            },
            {
              key: '2',
              label: `Checked In (${checkedIn.length})`,
              children: <Table columns={columns} dataSource={checkedIn} rowKey="id" />
            },
            {
              key: '3',
              label: 'History',
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <DatePicker.RangePicker
                      value={historyDateFilter}
                      onChange={setHistoryDateFilter}
                      format="DD MMM YYYY"
                      placeholder={['Start Date', 'End Date']}
                      style={{ width: 300 }}
                    />
                    {historyDateFilter && (
                      <Button onClick={() => setHistoryDateFilter(null)} size="small">
                        Clear Filter
                      </Button>
                    )}
                    <span style={{ color: '#888', fontSize: 12 }}>
                      Showing {filteredHistory.length} of {history.length} bookings
                    </span>
                  </div>
                  <Table columns={columns} dataSource={filteredHistory} rowKey="id" />
                </>
              )
            }
          ]}
        />
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
            <Space orientation="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
              <DatePicker.RangePicker showTime style={{ width: "100%" }} />
            </Space>
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

      {/* ================= CANCELLATION MODAL ================= */}
      <Modal
        title={<><ExclamationCircleOutlined style={{ color: "red" }} /> Cancel Booking</>}
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        onOk={handleCancelSubmit}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true, loading: cancelSubmitLoading }}
        confirmLoading={cancelSubmitLoading}
      >
        <p>Are you sure you want to cancel this booking?</p>

        {refundLoading ? (
          <p>Loading refund details...</p>
        ) : refundPreview ? (
          <Card variant="outlined" size="small" style={{ background: "#fff1f0", borderColor: "#ffa39e", marginBottom: 16 }}>
            <p><strong>Total Amount:</strong> ₹{refundPreview.total_amount}</p>
            <p><strong>Refund Amount:</strong> <span style={{ color: "green", fontSize: 16, fontWeight: "bold" }}>₹{refundPreview.refund_amount}</span> ({refundPreview.refund_percentage}%)</p>
            <Tag color={refundPreview.refund_percentage > 0 ? "green" : "red"}>{refundPreview.refund_label}</Tag>
          </Card>
        ) : (
          <p style={{ color: 'red' }}>Could not load refund details.</p>
        )}

        <Form layout="vertical">
          <Form.Item label="Cancellation Reason" required>
            <Input.TextArea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Why is the guest cancelling?"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BookingManagement;
