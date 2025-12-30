import { Modal, Form, Select, Button, notification } from "antd";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function AssignHotelModal({ open, onClose, user }) {
  const [form] = Form.useForm();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  const isMulti = user.role === "GROUP_ADMIN";

  useEffect(() => {
    api.get("property/hotels/").then(res => setHotels(res.data));
    
    form.setFieldsValue({
      hotels: user.hotels.map(h => h.id) || []
    });
  }, [user]);

  const handleSubmit = async (values) => {
    setLoading(true);

    const oldHotels = (user.hotels || []).map(h => h.id);
    const newHotels = isMulti ? values.hotels : [values.hotels];

    const toAdd = newHotels.filter(id => !oldHotels.includes(id));
    const toRemove = oldHotels.filter(id => !newHotels.includes(id));

    try {
      for (let hid of toAdd) {
        await api.post(`users/users/${user.uuid}/assign-hotel/`, {
          hotel_id: hid
        });
      }

      for (let hid of toRemove) {
        await api.post(`users/users/${user.uuid}/remove-hotel/`, {
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
