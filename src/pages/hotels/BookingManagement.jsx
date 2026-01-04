import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Space, Modal, Form, Select, DatePicker, Input, message, Tabs } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import dayjs from "dayjs";

const { Option } = Select;
const { TabPane } = Tabs;

function BookingManagement() {
  const { hotel_id } = useParams(); // URL should be /hotels/:hotel_id/bookings
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [form] = Form.useForm();

  // Fetch Data
  useEffect(() => {
    fetchBookings();
    fetchRoomTypes();
  }, [hotel_id]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`property/hotels/${hotel_id}/bookings/`);
      setBookings(res.data);
    } catch (err) {
      message.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get(`property/hotels/${hotel_id}/room-types/`);
      setRoomTypes(res.data);
    } catch (err) {
      console.error("Failed to load room types");
    }
  };

  // Handle Walk-in Submission
  const handleWalkIn = async (values) => {
    try {
      const payload = {
        hotel_id: hotel_id,
        room_type_id: values.room_type_id,
        user_uuid: "00000000-0000-0000-0000-000000000000", // MOCK GUEST UUID or input from form
        check_in: values.dates[0].toISOString(),
        check_out: values.dates[1].toISOString(),
        booking_type: values.booking_type,
        is_walk_in: true
      };

      await api.post(`property/bookings/create/`, payload);
      message.success("Walk-in Booking Confirmed!");
      setIsModalOpen(false);
      form.resetFields();
      fetchBookings(); // Refresh table
    } catch (err) {
      // Backend returns 409 if no rooms available
      if (err.response && err.response.status === 409) {
        message.error("No rooms available for this time slot!");
      } else {
        message.error("Booking failed");
      }
    }
  };

  const columns = [
    {
      title: "Reference",
      dataIndex: "booking_reference",
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: "Type",
      dataIndex: "booking_type",
      render: (type) => (
        <Tag color={type === 'HOURLY' ? 'purple' : 'blue'}>
          {type}
        </Tag>
      )
    },
    {
      title: "Room Category",
      dataIndex: ["room_type", "name"], // Nested data access
    },
    {
      title: "Check In",
      dataIndex: "scheduled_check_in",
      render: (date) => dayjs(date).format("DD MMM, HH:mm")
    },
    {
      title: "Check Out",
      dataIndex: "scheduled_check_out",
      render: (date) => dayjs(date).format("DD MMM, HH:mm")
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        let color = 'default';
        if (status === 'CONFIRMED') color = 'green';
        if (status === 'CHECKED_IN') color = 'gold';
        if (status === 'CANCELLED') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      render: (amt) => `₹${amt}`
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader 
        title="Front Desk & Bookings" 
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            New Walk-in
          </Button>
        }
      />

      <Tabs defaultActiveKey="1">
        <TabPane tab="All Bookings" key="1">
          <Table 
            columns={columns} 
            dataSource={bookings} 
            rowKey="id" 
            loading={loading} 
          />
        </TabPane>
        <TabPane tab="Checked In" key="2">
           {/* Filter logic usually goes here */}
           <Table 
            columns={columns} 
            dataSource={bookings.filter(b => b.status === 'CHECKED_IN')} 
            rowKey="id" 
           />
        </TabPane>
      </Tabs>

      {/* WALK-IN MODAL */}
      <Modal
        title="New Walk-in Booking"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleWalkIn}>
          
          <Form.Item label="Guest Name (Mock)" name="guest_name">
            <Input prefix={<UserOutlined />} placeholder="Enter Guest Name" />
          </Form.Item>

          <Form.Item label="Booking Type" name="booking_type" initialValue="NIGHTLY">
            <Select onChange={() => form.setFieldsValue({ dates: null })}>
              <Option value="NIGHTLY">Nightly Stay</Option>
              <Option value="HOURLY">Hourly Stay</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Room Category" name="room_type_id" rules={[{ required: true }]}>
            <Select placeholder="Select a Category">
              {roomTypes.map(rt => (
                <Option key={rt.id} value={rt.id}>
                  {rt.name} (Avl: {rt.total_inventory})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Duration" name="dates" rules={[{ required: true }]}>
            <DatePicker.RangePicker 
              showTime 
              format="YYYY-MM-DD HH:mm" 
              style={{ width: '100%' }} 
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Confirm Booking
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

import { Typography } from "antd";
const { Text } = Typography;

export default BookingManagement;