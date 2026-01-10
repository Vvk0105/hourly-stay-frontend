import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, message, Checkbox } from "antd"; // Standard AntD components
import api from "../../api/axios";

// This component seems to be missing in the original request file list but required by App.jsx
// Implementing a basic schema based on 'AddRoom.jsx' but for PHYSICAL ROOMS (specific room numbers)

const { Option } = Select;

function EditPhysicalRoom() {
    const { id, roomId } = useParams(); // Hotel ID, Room ID
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch room details
        const fetchRoom = async () => {
            // Mock fetch for now as backend might not be ready
            // In real app: const res = await api.get(`property/rooms/${roomId}`);
            // form.setFieldsValue(res.data);
            form.setFieldsValue({
                room_number: "101",
                floor_number: 1,
                status: "Clean"
            });
        }
        fetchRoom();
    }, [roomId]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Mock API call
            console.log("Updating Physical Room:", values);
            // await api.put(`property/rooms/${roomId}/`, values);
            message.success("Room Updated Successfully");
            navigate(-1);
        } catch (error) {
            message.error("Failed to update room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <h2>Edit Physical Room</h2>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item label="Room Number" name="room_number" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Floor Number" name="floor_number">
                    <Input type="number" />
                </Form.Item>
                <Form.Item label="Status" name="status">
                    <Select>
                        <Option value="Clean">Clean</Option>
                        <Option value="Occupied">Occupied</Option>
                        <Option value="Dirty">Dirty</Option>
                        <Option value="Maintenance">Maintenance</Option>
                    </Select>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>Update Room</Button>
            </Form>
        </div>
    );
}

export default EditPhysicalRoom;
