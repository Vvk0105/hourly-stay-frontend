import { Modal, Form, Select, Button, notification } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";

function AssignHotelModal({ open, onClose, user }) {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [hotels, setHotels] = useState(currentUser?.hotels || []);
  const [loading, setLoading] = useState(false);

  const isMulti = user.role === "GROUP_ADMIN";

  useEffect(() => {
    if (open) {
      if (currentUser?.role === "SUPER_ADMIN") {
        api.get("property/hotels/").then(res => {
          if (res.data.results && res.data.results.length > 0) {
            setHotels(res.data.results);
          }
        });
      } else {
        setHotels(currentUser?.hotels || []);
      }
      
      const hotelIds = (user.hotels || []).map(h => (typeof h === "object" ? h.id : h));
      form.setFieldsValue({
        hotels: isMulti ? hotelIds : hotelIds[0]
      });
    }
  }, [user, open, currentUser, isMulti, form]);

  const handleSubmit = async (values) => {
    setLoading(true);

    const oldHotels = (user.hotels || []).map(h => h.id);
    const newHotels = isMulti ? values.hotels : [values.hotels];

    const toAdd = newHotels.filter(id => !oldHotels.includes(id));
    const toRemove = oldHotels.filter(id => !newHotels.includes(id));

    try {
      // ✅ Sequential updates: remove old ones first to stay within single-hotel limits
      for (let hid of toRemove) {
        await api.post(`users/users/${user.uuid}/remove-hotel/`, {
          hotel_id: hid
        });
      }

      for (let hid of toAdd) {
        await api.post(`users/users/${user.uuid}/assign-hotel/`, {
          hotel_id: hid
        });
      }

      notification.success({
        message: "Hotel assignment updated"
      });

      onClose(true);
    } catch {
      notification.error({
        message: "Failed to update hotel assignment"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Assign / Change Hotel"
      onCancel={() => onClose(false)}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item name="hotels" label="Hotel" rules={[{ required: true }]}>
          <Select
            id="hotels"
            name="hotels"
            mode={isMulti ? "multiple" : undefined}
            placeholder="Select Hotel"
          >
            {hotels.map(h => (
              <Select.Option key={h.id} value={h.id}>
                {h.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Submit
        </Button>
      </Form>
    </Modal>
  );
}

export default AssignHotelModal;
