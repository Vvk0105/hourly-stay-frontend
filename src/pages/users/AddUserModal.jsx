import { Modal, Form, Input, Select, Button } from "antd";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function AddUserModal({ open, onClose, role }) {
  const [form] = Form.useForm();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  const CREATE_USER_API_MAP = {
    GROUP_ADMIN: "users/create-group-admin/",
    HOTEL_MANAGER: "users/create-hotel-manager/",
    HOTEL_STAFF: "users/create-staff/",
    SUPPORT: "users/create-support-agent/",
  };

  useEffect(() => {
    if (open) {
      api.get("property/hotels/").then((res) => {
        setHotels(res.data);
      });
    }
  }, [open]);
  console.log('test hotels', hotels);

  const isMultiHotel = role === "GROUP_ADMIN";

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const payload = {
        username: values.username,
        email: values.email,
        phone_number: values.phone,
      };

      if (role === "GROUP_ADMIN") {
        payload.hotel_ids = values.hotels;
      } else if (role !== "SUPPORT") {
        payload.hotel_id = values.hotels;
      }


      await api.post(CREATE_USER_API_MAP[role], payload);

      form.resetFields();
      onClose(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Add ${role.replace("_", " ")}`}
      onCancel={() => onClose(false)}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {role !== "SUPPORT" && (
          <Form.Item
            label="Hotel"
            name="hotels"
            rules={[{ required: true }]}
          >
            <Select
              mode={role === "GROUP_ADMIN" ? "multiple" : undefined}
              placeholder="Select Hotel"
            >
              {hotels.map((h) => (
                <Select.Option key={h.id} value={h.id}>
                  {h.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="Username" name="username" rules={[{ required: true }]}>
          <Input placeholder="Username" />
        </Form.Item>

        <Form.Item label="Email ID" name="email" rules={[
          { required: true, message: "Please enter Email ID" },
          { type: 'email', message: "Please enter a valid email" }
        ]}>
          <Input placeholder="Email ID" />
        </Form.Item>

        <Form.Item label="Phone Number" name="phone" rules={[
          { required: true, message: "Please enter Phone Number" },
          { pattern: /^[0-9]{10}$/, message: "Phone number must be 10 digits" }
        ]}>
          <Input placeholder="Phone Number" maxLength={10} />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
        >
          Submit
        </Button>
      </Form>
    </Modal>
  );
}

export default AddUserModal;
