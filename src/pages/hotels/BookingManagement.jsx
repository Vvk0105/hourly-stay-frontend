import React, { useState, useEffect } from "react";
import {
  Table, Button, Tag, Tabs, Modal, Select, message,
  Card, Popconfirm, Tooltip, Badge, Form, DatePicker, Input, Switch, Row, Col, Typography, Radio, Alert, Statistic, Calendar
} from "antd";
import {
  LoginOutlined, LogoutOutlined, CloseCircleOutlined,
  HomeOutlined, UserOutlined, PlusOutlined, ClockCircleOutlined, SearchOutlined, CalendarOutlined, ThunderboltOutlined, PoweroffOutlined,
  EyeOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);


const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function BookingManagement() {
  const { id } = useParams(); // Only hotel ID needed
  const navigate = useNavigate();


  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Hourly Mode State
  const [hourlyStatus, setHourlyStatus] = useState("INACTIVE");
  const [currentWindow, setCurrentWindow] = useState(null);
  const [showHourlyConfigModal, setShowHourlyConfigModal] = useState(false);
  const [hourlyConfigType, setHourlyConfigType] = useState('AUTO');
  const [customRange, setCustomRange] = useState([]);
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Date Filter State
  const [upcomingDateFilter, setUpcomingDateFilter] = useState(null);
  const [historyDateFilter, setHistoryDateFilter] = useState(null);

  // Calendar Modal State
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // New Booking Modal State
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('NIGHTLY');
  const [newBookingForm] = Form.useForm();

  // Walk-in Hourly Slots State
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedRoomTypeForSlots, setSelectedRoomTypeForSlots] = useState(null);

  // Check-in Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Data State
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [roomStatusLoading, setRoomStatusLoading] = useState({});

  const [hotelTimezone, setHotelTimezone] = useState("UTC");

  const fetchHotelDetails = async () => {
    try {
      const res = await api.get(`property/hotels/${id}/`);
      setHotelTimezone(res.data.timezone || "UTC");
    } catch (err) {
      console.error("Failed to fetch hotel timezone");
    }
  };

  const filteredRooms = rooms.filter(
    r => !selectedRoomType || r.room_type === selectedRoomType
  );

  /* ================= ROOM STATUS CHANGE HANDLER ================= */
  const handleQuickStatusChange = async (roomId, newStatus) => {
    setRoomStatusLoading(prev => ({ ...prev, [roomId]: true }));
    try {
      await api.patch(`property/rooms/${roomId}/status/`, { status: newStatus });
      message.success(`Room status updated to ${newStatus}`);
      fetchRooms(); // Refresh rooms list
    } catch (error) {
      console.error("Status change error:", error);
      message.error("Failed to update status");
    } finally {
      setRoomStatusLoading(prev => ({ ...prev, [roomId]: false }));
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRoomTypes();
    fetchRooms();
    fetchHourlyStatus();
    fetchHotelDetails();
    fetchSlots();

    const interval = setInterval(() => {
      fetchSlots();
    }, 10000);

    return () => clearInterval(interval);
  }, [id, selectedDate]);

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

  const fetchHourlyStatus = async () => {
    try {
      const res = await api.get(`property/hotels/${id}/hourly-operations/`);
      setHourlyStatus(res.data.status);
      if (res.data.status === 'ACTIVE' && res.data.window) {
        setCurrentWindow(res.data.window);
        fetchSlots();
      }
    } catch (err) {
      console.error("Failed to fetch hourly status", err);
    }
  };

  const fetchSlots = async (date = null) => {
    setSlotsLoading(true);
    try {
      const dateStr = (date || selectedDate).format('YYYY-MM-DD');
      const res = await api.get(`property/hotels/${id}/room-slots/?date=${dateStr}`);
      setSlotsData(res.data);
    } catch (e) {
      console.error("Failed to fetch slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchWalkinSlots = async (roomTypeId) => {
    if (!roomTypeId || bookingType !== 'HOURLY') {
      setAvailableSlots([]);
      return;
    }

    try {
      setSlotsError(null);
      const dateStr = dayjs().format('YYYY-MM-DD');
      const res = await api.get(`property/public/hotels/${id}/available-slots/?room_type_id=${roomTypeId}&date=${dateStr}`);

      if (res.data.success && res.data.available_slots) {
        setAvailableSlots(res.data.available_slots);

        // Store config for min duration display
        if (res.data.config) {
          setSelectedRoomTypeForSlots({
            min_duration: res.data.config.min_duration_hours
          });
        }
      } else {
        setAvailableSlots([]);
        setSlotsError(res.data.message || 'No slots available');
      }
    } catch (err) {
      console.error("Failed to fetch walk-in slots", err);
      setSlotsError('Failed to load available slots');
      setAvailableSlots([]);
    }
  };

  /* ================= HANDLERS ================= */
  const handleHourlySwitch = (checked) => {
    if (checked) {
      setShowHourlyConfigModal(true);
    } else {
      handleStopHourly();
    }
  };

  const handleStartHourly = async () => {
    try {
      const payload = { mode: hourlyConfigType };

      if (hourlyConfigType === 'CUSTOM') {
        if (!customRange || customRange.length < 2) {
          message.error("Please select a time range");
          return;
        }
        payload.start_datetime = customRange[0].toISOString();
        payload.end_datetime = customRange[1].toISOString();
      }

      const res = await api.post(`property/hotels/${id}/hourly-operations/`, payload);
      console.log('hourly opertaion', res);
      
      setHourlyStatus("ACTIVE");
      setCurrentWindow(res.data.window);
      setShowHourlyConfigModal(false);
      message.success(`Hourly Booking Enabled (${hourlyConfigType === 'AUTO' ? 'Auto Mode' : 'Custom Schedule'})`);
      fetchSlots();
    } catch (err) {
      console.error(err);
      message.error("Failed to start hourly operations");
    }
  };

  const handleStopHourly = async () => {
    try {
      await api.delete(`property/hotels/${id}/hourly-operations/`);
      setHourlyStatus("INACTIVE");
      setCurrentWindow(null);
      setSlotsData(null);
      message.info("Hourly Booking Disabled");
    } catch (err) {
      console.error(err);
      message.error("Failed to stop hourly operations");
    }
  };

  const handleNewBooking = async (values) => {
    try {
      const payload = {
        hotel_id: id,
        room_type_id: values.room_type_id,
        user_uuid: "00000000-0000-0000-0000-000000000000", // Default/Guest UUID
        booking_type: bookingType,
        is_walk_in: true,

        // Guest details
        guest_name: values.guest_name,
        guest_email: values.guest_email,
        guest_phone: values.guest_phone,
        guest_id_type: values.guest_id_type || null,
        guest_id_number: values.guest_id_number || null
      };

      if (bookingType === 'NIGHTLY') {
        // Validate same-day check-in/out for nightly bookings
        if (values.check_in_date.isSame(values.check_out_date, 'day')) {
          message.error('For nightly bookings, check-out must be on a different date than check-in');
          return;
        }

        payload.check_in = values.check_in_date.format('YYYY-MM-DD') + 'T' + values.check_in_time.format('HH:mm:ss');
        payload.check_out = values.check_out_date.format('YYYY-MM-DD') + 'T' + values.check_out_time.format('HH:mm:ss');
      } else {
      // HOURLY logic

      if (!values.check_in_date || !values.start_time || !values.end_time) {
        message.error("Please select date, start time and end time");
        return;
      }

      // Combine date + start time
      const localCheckIn = dayjs(
        values.check_in_date.format('YYYY-MM-DD') + 'T' +
        values.start_time.format('HH:mm:ss')
      );

      // Combine date + end time
      let localCheckOut = dayjs(
        values.check_in_date.format('YYYY-MM-DD') + 'T' +
        values.end_time.format('HH:mm:ss')
      );

      // If end time is next day (like 11PM → 2AM)
      if (localCheckOut.isBefore(localCheckIn)) {
        localCheckOut = localCheckOut.add(1, 'day');
      }

      // Convert to UTC ISO format
      payload.check_in = localCheckIn.utc().toISOString();
      payload.check_out = localCheckOut.utc().toISOString();
    }

      await api.post(`property/bookings/create/`, payload);
      message.success("Walk-in Booking Created Successfully!");
      setIsNewBookingModalOpen(false);
      newBookingForm.resetFields();
      fetchBookings();
    } catch (err) {
      console.error("Booking error:", err);

      // Handle validation errors from backend
      if (err.response?.data) {
        const errors = err.response.data;

        // Display field-specific errors
        Object.keys(errors).forEach(field => {
          const errorMsg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
          message.error(`${field.replace(/_/g, ' ')}: ${errorMsg}`);
        });
      } else if (err.response?.status === 409) {
        message.error("No rooms available for the selected dates!");
      } else {
        message.error("Booking failed. Please try again.");
      }
    }
  };

  const openCheckInModal = async (booking) => {
    setSelectedBooking(booking);
    setIsCheckInModalOpen(true);
    setAvailableRooms([]);
    setSelectedRoomId(null);
    setAssignLoading(true);

    try {
      const res = await api.get(`property/bookings/${booking.id}/available-rooms/`);
      setAvailableRooms(res.data);
    } catch {
      message.error("Could not fetch available rooms");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedRoomId) {
      message.error("Please select a room number");
      return;
    }

    try {
      await api.post(`property/bookings/${selectedBooking.id}/action/`, {
        action: "CHECK_IN",
        room_id: selectedRoomId
      });
      message.success("Guest Checked In Successfully");
      setIsCheckInModalOpen(false);
      setSelectedRoomId(null);
      setAvailableRooms([]);
      fetchBookings();
    } catch {
      message.error("Check-in failed");
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.post(`property/bookings/${bookingId}/action/`, { action });
      message.success(`${action} successful`);
      fetchBookings();
      if (hourlyStatus === 'ACTIVE') {
        fetchSlots(); // Refresh hourly visualization
      }
    } catch {
      message.error(`${action} failed`);
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
      dataIndex: "room_type",
      render: (roomTypeId) => {
        if (!roomTypeId) return "-";
        const rt = roomTypes.find(rt => rt.id == roomTypeId);
        return rt ? rt.name : `Type #${roomTypeId}`;
      }
    },
    {
      title: "Dates",
      render: (_, r) => (
        <div style={{ fontSize: '13px' }}>
          <div>In: <span style={{ fontWeight: 500 }}>{dayjs.utc(r.scheduled_check_in).tz(hotelTimezone).format("DD MMM, HH:mm")}</span></div>
          <div>Out: <span style={{ fontWeight: 500 }}>{dayjs.utc(r.scheduled_check_out).tz(hotelTimezone).format("DD MMM, HH:mm")}</span></div>
        </div>
      )
    },
    {
      title: "Rooms",
      dataIndex: "assigned_room",
      render: (roomId) => {
        if (!roomId) return <span style={{ color: '#aaa' }}>-</span>;

        const room = rooms.find(r => r.id === roomId);
        return room ? <Tag>{room.room_number}</Tag> : <Tag>Room #{roomId}</Tag>;
      }
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
        return <Tag color={config.color} style={{ borderRadius: 12, padding: '0 10px' }}>{config.label}</Tag>;
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
      key: "action",
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {r.status === 'CONFIRMED' && (
            <Button type="primary" style={{ backgroundColor: '#333', borderColor: '#333' }} size="small" onClick={() => openCheckInModal(r)}>Check In</Button>
          )}
          {r.status === 'CHECKED_IN' && (
            <Popconfirm title="Confirm Check Out?" onConfirm={() => handleBookingAction(r.id, "CHECK_OUT")}>
              <Button type="primary" style={{ backgroundColor: '#333', borderColor: '#333' }} size="small">Check Out</Button>
            </Popconfirm>
          )}
          {r.status === 'CONFIRMED' && (
            <Popconfirm title="Cancel Booking?" onConfirm={() => handleBookingAction(r.id, "CANCEL")}>
              <Button type="text" danger icon={<CloseCircleOutlined />} size="small" />
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/booking-details/${r.id}`)}
          />
        </div>
      )
    }
  ];


  /* ================= DATA FILTERING ================= */
  const filterByDateRange = (bookingsList, dateRange) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return bookingsList;

    const [startDate, endDate] = dateRange;
    return bookingsList.filter(booking => {
      const checkInDate = dayjs(booking.scheduled_check_in);
      // Check if checkInDate is between startDate and endDate (inclusive)
      return (checkInDate.isAfter(startDate, 'day') || checkInDate.isSame(startDate, 'day')) &&
        (checkInDate.isBefore(endDate, 'day') || checkInDate.isSame(endDate, 'day'));
    });
  };

  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const checkedIn = bookings.filter(b => b.status === "CHECKED_IN");
  const history = bookings.filter(b => ["CHECKED_OUT", "CANCELLED"].includes(b.status));

  // Apply date filters
  const filteredConfirmed = filterByDateRange(confirmed, upcomingDateFilter);
  const filteredHistory = filterByDateRange(history, historyDateFilter);

  const calendarDayBookings = selectedCalendarDate
    ? bookings.filter(b =>
      dayjs(b.scheduled_check_in).format('YYYY-MM-DD') ===
      selectedCalendarDate.format('YYYY-MM-DD')
    )
    : [];

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
          <Switch checked={hourlyStatus === 'ACTIVE'} onChange={handleHourlySwitch} />
          <span style={{ color: '#888' }}>{hourlyStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
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
              children: (
                <div>
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
                  <Table columns={columns} dataSource={filteredConfirmed} rowKey="id" pagination={{ pageSize: 5 }} />
                </div>
              )
            },
            {
              key: 'checked_in',
              label: `Checked In (${checkedIn.length})`,
              children: <Table columns={columns} dataSource={checkedIn} rowKey="id" />
            },
            {
              key: 'available_rooms',
              label: 'Rooms',
              children: (
                <div>
                  {/* Filter Section */}
                  <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <Select
                      placeholder="Filter by Room Type"
                      allowClear
                      style={{ width: 250 }}
                      value={selectedRoomType}
                      onChange={setSelectedRoomType}
                    >
                      <Option value="">All Room Types</Option>
                      {roomTypes.map(rt => (
                        <Option key={rt.id} value={rt.id}>{rt.name}</Option>
                      ))}
                    </Select>
                    <Text type="secondary">
                      Showing {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
                    </Text>
                  </div>

                  {/* Rooms Grid */}
                  <Row gutter={[16, 16]}>
                    {rooms.length === 0 ? (
                      <Col span={24}>
                        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                          <HomeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                          <div>No rooms found</div>
                        </div>
                      </Col>
                    ) : (
                      rooms
                        .filter(room => !selectedRoomType || room.room_type === selectedRoomType)
                        .map(room => {
                          // Find if room is currently occupied
                          const currentBooking = bookings.find(
                            b => b.assigned_room?.id === room.id &&
                              ['CONFIRMED', 'CHECKED_IN'].includes(b.status)
                          );

                          const isOccupied = !!currentBooking;
                          const isDirty = room.current_status === 'DIRTY';
                          const isMaintenance = room.current_status === 'MAINTENANCE';
                          const isAvailable = !isOccupied && room.current_status === 'CLEAN';

                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                              <Card
                                hoverable={isAvailable}
                                style={{
                                  borderColor: isAvailable ? '#52c41a' : isDirty ? '#faad14' : isMaintenance ? '#ff4d4f' : '#d9d9d9',
                                  borderWidth: 2
                                }}
                              >
                                {/* Room Image/Icon */}
                                <div style={{
                                  height: 120,
                                  background: isAvailable ? '#f6ffed' : isDirty ? '#fffbe6' : isMaintenance ? '#fff1f0' : '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: 16,
                                  borderRadius: 8
                                }}>
                                  <HomeOutlined style={{
                                    fontSize: 48,
                                    color: isAvailable ? '#52c41a' : isDirty ? '#faad14' : isMaintenance ? '#ff4d4f' : '#bfbfbf'
                                  }} />
                                </div>

                                {/* Room Info */}
                                <div style={{ marginBottom: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text strong style={{ fontSize: 16 }}>Room {room.room_number}</Text>
                                    {isAvailable && <Tag color="success">AVAILABLE</Tag>}
                                    {isOccupied && <Tag color="error">OCCUPIED</Tag>}
                                    {isDirty && !isOccupied && <Tag color="warning">DIRTY</Tag>}
                                    {isMaintenance && <Tag color="error">MAINTENANCE</Tag>}
                                  </div>

                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {roomTypes.find(rt => rt.id === room.room_type)?.name || '-'}
                                  </Text>

                                  {currentBooking && (
                                    <div style={{ marginTop: 8, padding: 8, background: '#fff1f0', borderRadius: 4 }}>
                                      <Text style={{ fontSize: 12, color: '#cf1322' }}>
                                        <UserOutlined /> {currentBooking.guest_name || 'Guest'}<br />
                                        Until: {dayjs.utc(currentBooking.scheduled_check_out)
                                        .tz(hotelTimezone || "UTC")
                                        .format('DD MMM, HH:mm')}
                                      </Text>
                                    </div>
                                  )}

                                  {/* Room Details */}
                                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                      <Text type="secondary">Floor: {room.floor_number || 1}</Text>
                                      <Text type="secondary">Status: {room.current_status}</Text>
                                    </div>
                                  </div>
                                </div>
                                <Select
                                  value={room.current_status || 'CLEAN'}
                                  onChange={(newStatus) => handleQuickStatusChange(room.id, newStatus)}
                                  loading={roomStatusLoading[room.id]}
                                  style={{ width: '100%' }}
                                  size="small"
                                >
                                  <Option value="CLEAN">
                                    <Tag color="green" style={{ margin: 0 }}>CLEAN</Tag>
                                  </Option>
                                  <Option value="DIRTY">
                                    <Tag color="orange" style={{ margin: 0 }}>DIRTY</Tag>
                                  </Option>
                                  <Option value="MAINTENANCE">
                                    <Tag color="red" style={{ margin: 0 }}>MAINTENANCE</Tag>
                                  </Option>
                                </Select>
                              </Card>
                            </Col>
                          );
                        })
                    )}
                  </Row>
                </div>
              )
            },
            {
              key: 'slots',
              label: 'Slots',
              children: (
                <div>
                  {hourlyStatus === 'ACTIVE' && currentWindow && (
                    <Alert
                      message={`Hourly Booking is enabled until ${dayjs.utc(currentWindow.start_datetime).tz(hotelTimezone).format('DD MMM YYYY, HH:mm')} to ${dayjs.utc(currentWindow.end_datetime).tz(hotelTimezone).format('DD MMM YYYY, HH:mm')}`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: 20 }}
                    />
                  )}

                  {/* Date Picker Controls */}
                  <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        fetchSlots(date);
                      }}
                      format="DD MMM YYYY"
                      style={{ width: 200 }}
                    />
                    <Button onClick={() => {
                      setSelectedDate(dayjs());
                      fetchSlots(dayjs());
                    }}>
                      Today
                    </Button>
                    <Button onClick={() => {
                      const tomorrow = dayjs().add(1, 'day');
                      setSelectedDate(tomorrow);
                      fetchSlots(tomorrow);
                    }}>
                      Tomorrow
                    </Button>
                  </div>

                  {/* Color Legend */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: 12, backgroundColor: '#fafafa', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, backgroundColor: '#ffccc7', borderRadius: 4, border: '1px solid #ddd' }} />
                      <Text style={{ fontSize: 13 }}>Hourly Booking</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, backgroundColor: '#bae7ff', borderRadius: 4, border: '1px solid #ddd' }} />
                      <Text style={{ fontSize: 13 }}>Nightly Booking</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, backgroundColor: '#d9f7be', borderRadius: 4, border: '1px solid #ddd' }} />
                      <Text style={{ fontSize: 13 }}>Available</Text>
                    </div>
                  </div>

                  {slotsData?.rooms && slotsData.rooms.length > 0 && (
                    <Row gutter={[16, 16]}>
                      {slotsData.rooms.map(room => (
                        <Col span={12} key={room.id}>
                          <Card bordered={true} style={{ borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                              <span style={{ fontWeight: 600 }}>Room. {room.number}</span>
                              <Tag>{room.type}</Tag>
                              <Tag color={room.status === 'CLEAN' ? 'success' : room.status === 'DIRTY' ? 'warning' : 'error'}>
                                {room.status}
                              </Tag>
                            </div>

                            {/* Timeline Bar */}
                            <div style={{ display: 'flex', height: 40, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                              {room.slots.length === 0 ? (
                                <div style={{ width: '100%', textAlign: 'center', color: '#888', padding: 8, fontSize: 12 }}>
                                  No Availability Data
                                </div>
                              ) : (
                                room.slots.map((slot, idx) => {
                                  const start = dayjs.utc(slot.start).tz(hotelTimezone);
                                  const end = dayjs.utc(slot.end).tz(hotelTimezone);
                                  const crossesDay = !start.isSame(end, 'day');
                                  const timeLabel = crossesDay
                                    ? `${start.format('HH:mm')} - ${end.format('HH:mm')} (+1 day)`
                                    : `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
                                  const safeEnd = end.isBefore(start) ? end.add(1, 'day') : end;
                                  const durationMins = safeEnd.diff(start, 'minute');

                                  return (
                                    <Tooltip
                                      key={idx}
                                      title={
                                        slot.type === 'BOOKED'
                                          ? `${slot.booking_type} | ${timeLabel}`
                                          : `Available | ${timeLabel}`
                                      }
                                    >
                                      <div style={{
                                        flex: durationMins,
                                        height: '100%',
                                        backgroundColor: slot.type === 'BOOKED'
                                          ? (slot.booking_type === 'HOURLY' ? '#ffccc7' : '#bae7ff')
                                          : '#d9f7be',
                                        borderRight: '1px solid #fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        color: '#555',
                                        cursor: 'pointer',
                                        minWidth: 30,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden'
                                      }}>
                                        {slot.type === 'BOOKED' ? 'Booked' : 'Free'}
                                      </div>
                                    </Tooltip>
                                  );
                                })
                              )}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}

                  {(!slotsData || !slotsData.rooms || slotsData.rooms.length === 0) && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <div>No rooms or slots data available</div>
                      <div style={{ marginTop: 8 }}>Add rooms to see the occupancy timeline</div>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'history',
              label: 'History',
              children: (
                <div>
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
                </div>
              )
            },
            {
              key: 'calendar',
              label: '📅 Calendar',
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Total Bookings"
                          value={bookings.length}
                          prefix={<CalendarOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Confirmed"
                          value={confirmed.length}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Hourly Bookings"
                          value={bookings.filter(b => b.booking_type === 'HOURLY').length}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Nightly Bookings"
                          value={bookings.filter(b => b.booking_type === 'NIGHTLY').length}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Calendar
                    dateCellRender={(value) => {
                      const dateStr = value.format('YYYY-MM-DD');
                      const dayBookings = bookings.filter(b => {
                        const checkIn = dayjs(b.scheduled_check_in).format('YYYY-MM-DD');
                        return checkIn === dateStr;
                      });
                      if (dayBookings.length === 0) return null;

                      let badgeColor = 'green';
                      if (dayBookings.length >= 10) badgeColor = 'red';
                      else if (dayBookings.length >= 5) badgeColor = 'orange';

                      return (
                        <div style={{ textAlign: 'center' }}>
                          <Badge count={dayBookings.length} style={{ backgroundColor: badgeColor }} />
                        </div>
                      );
                    }}
                    onSelect={(date) => {
                      const dateStr = date.format('YYYY-MM-DD');
                      const dayBookings = bookings.filter(b => {
                        const checkIn = dayjs(b.scheduled_check_in).format('YYYY-MM-DD');
                        return checkIn === dateStr;
                      });
                      if (dayBookings.length > 0) {
                        setSelectedCalendarDate(date);
                        setIsCalendarModalVisible(true);
                      }
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>
      {/* CALENDAR BOOKINGS MODAL */}
      <Modal
        title={
          <>
            <CalendarOutlined /> Bookings on{" "}
            {selectedCalendarDate?.format("DD MMM YYYY")}
          </>
        }
        open={isCalendarModalVisible}
        onCancel={() => setIsCalendarModalVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          columns={columns}
          dataSource={calendarDayBookings}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>

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
            <Text style={{ display: 'block', marginBottom: 8 }}>Select Time Range:</Text>
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              onChange={(dates) => setCustomRange(dates)}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <Button
          type="primary"
          block
          size="large"
          onClick={handleStartHourly}
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
          {hourlyStatus === 'ACTIVE' && (
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

          <Form.Item
            label="Guest Name"
            name="guest_name"
            rules={[{ required: true, message: 'Guest name is required' }]}
          >
            <Input placeholder="Enter guest full name" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Guest Email"
                name="guest_email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="guest@example.com" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Guest Phone"
                name="guest_phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input placeholder="+91 9876543210" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="ID Type (Optional)" name="guest_id_type">
                <Select placeholder="Select ID type" allowClear style={{ borderRadius: 6 }}>
                  <Option value="AADHAAR">Aadhaar Card</Option>
                  <Option value="PAN">PAN Card</Option>
                  <Option value="PASSPORT">Passport</Option>
                  <Option value="DRIVING_LICENSE">Driving License</Option>
                  <Option value="VOTER_ID">Voter ID</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ID Number (Optional)" name="guest_id_number">
                <Input placeholder="Enter ID number" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Check In Date" name="check_in_date" rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: '100%', borderRadius: 6 }}
                  onChange={(date) => {
                    // Fetch slots when date changes for HOURLY booking
                    if (bookingType === 'HOURLY') {
                      const roomTypeId = newBookingForm.getFieldValue('room_type_id');
                      if (roomTypeId && date) {
                        fetchWalkinSlots(roomTypeId, date);
                      }
                    }
                  }}
                />
              </Form.Item>
            </Col>
            {bookingType === 'NIGHTLY' && (
              <Col span={12}>
                <Form.Item label="Check In Time" name="check_in_time" rules={[{ required: true }]}>
                  <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
            )}
          </Row>

          {bookingType === 'NIGHTLY' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Check Out Date" name="check_out_date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Check Out Time" name="check_out_time" rules={[{ required: true }]}>
                  <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* HOURLY TIME SELECTION - After date, before slots display */}
          {bookingType === 'HOURLY' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Start Time" name="start_time" rules={[{ required: true }]}>
                  <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="End Time" name="end_time" rules={[{ required: true }]}>
                  <DatePicker picker="time" format="HH:mm" style={{ width: '100%', borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category" name="room_type_id" rules={[{ required: true }]}>
                <Select
                  placeholder="Select"
                  style={{ borderRadius: 6 }}
                  onChange={(value) => {
                    // Fetch available slots when room type changes and booking type is HOURLY
                    if (bookingType === 'HOURLY') {
                      fetchWalkinSlots(value);
                    }
                  }}
                >
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

          {/* HOURLY SLOTS DISPLAY */}
          {bookingType === 'HOURLY' && availableSlots.length > 0 && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ color: '#0050b3' }}>
                  <ClockCircleOutlined /> Available Time Slots (Today)
                </Text>
                {selectedRoomTypeForSlots?.min_duration && (
                  <Tag color="blue">Min: {selectedRoomTypeForSlots.min_duration}h</Tag>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableSlots.map((slot, idx) => {
                  const start = dayjs.utc(slot.start).tz(hotelTimezone);
                  const end = dayjs.utc(slot.end).tz(hotelTimezone);
                  const duration = end.diff(start, 'hour', true);

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid #91d5ff',
                        borderRadius: 6,
                        fontSize: 12
                      }}
                    >
                      <div style={{ fontWeight: 500, color: '#0050b3' }}>
                        {start.format('HH:mm')} - {end.format('HH:mm')}
                      </div>
                      <div style={{ color: '#888', fontSize: 11 }}>
                        {duration.toFixed(1)}h
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SLOTS ERROR */}
          {bookingType === 'HOURLY' && slotsError && (
            <Alert
              message={slotsError}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* NO SLOTS MESSAGE */}
          {bookingType === 'HOURLY' && newBookingForm.getFieldValue('room_type_id') && availableSlots.length === 0 && !slotsError && (
            <Alert
              message="No available slots for selected room type today"
              description="Please select a different room type or date"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

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

      {/* CHECK-IN MODAL */}
      <Modal
        title={<><HomeOutlined /> Check In Guest</>}
        open={isCheckInModalOpen}
        onCancel={() => setIsCheckInModalOpen(false)}
        onOk={handleCheckIn}
        okText="Confirm & Check In"
        confirmLoading={assignLoading}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Select room"
          onChange={setSelectedRoomId}
          loading={assignLoading}
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
