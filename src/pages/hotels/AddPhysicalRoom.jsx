import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, message, Card, InputNumber } from "antd";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";

const { Option } = Select;

function AddPhysicalRoom() {
  const { id } = useParams(); // Hotel ID
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Categories first so user can select one
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get(`property/hotels/${id}/room-types/`);
        setRoomTypes(res.data);
      } catch (err) {
        message.error("Failed to load room categories");
      }
    };
    fetchTypes();
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      hotel: id,
      room_type: values.room_type_id,
      room_number: values.room_number,
      floor_number: values.floor_number,
      current_status: 'CLEAN',
      is_active: true
    };

    try {
      // Assuming you have an endpoint for creating physical rooms
      await api.post(`property/hotels/${id}/rooms/`, payload);
      message.success("Physical Room Added!");
      form.resetFields();
      // Optional: navigate back or stay to add more
    } catch (err) {
      message.error("Failed to add room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <PageHeader title="Add Physical Room" />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          
          <Form.Item label="Select Category" name="room_type_id" rules={[{ required: true }]}>
            <Select placeholder="Select a Category (e.g. Deluxe)">
              {roomTypes.map(rt => (
                <Option key={rt.id} value={rt.id}>{rt.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Room Number/Name" name="room_number" rules={[{ required: true }]}>
            <Input placeholder="e.g. 101 or A-01" />
          </Form.Item>

          <Form.Item label="Floor Number" name="floor_number" initialValue={1}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Add Room
          </Button>
          <Button onClick={() => navigate(-1)} style={{ marginRight: 12 }}>Cancel</Button>
        </Form>
      </Card>
    </div>
  );
}

export default AddPhysicalRoom;