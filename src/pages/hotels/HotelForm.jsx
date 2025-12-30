import { Form, Input, Button, TimePicker, notification } from "antd";
import api from "../../api/axios";
import dayjs from "dayjs";

function HotelForm({ onCancel, onSuccess }) {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        check_in_time: values.check_in_time.format("HH:mm"),
        check_out_time: values.check_out_time.format("HH:mm"),
      };

      await api.post("property/hotels/", payload);

      notification.success({
        message: "Hotel created successfully",
      });

      onSuccess();
    } catch (err) {
      notification.error({
        message: "Failed to create hotel",
      });
    }
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={handleSubmit}
      style={{ maxWidth: 900 }}
    >
      <Form.Item
        label="Hotel Name"
        name="name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Address" name="address" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="City" name="city" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="State" name="state" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Zip Code" name="zip_code">
          <Input />
        </Form.Item>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="Phone Number" name="phone_number">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item
          label="Check In Time"
          name="check_in_time"
          rules={[{ required: true }]}
        >
          <TimePicker format="HH:mm" />
        </Form.Item>

        <Form.Item
          label="Check Out Time"
          name="check_out_time"
          rules={[{ required: true }]}
        >
          <TimePicker format="HH:mm" />
        </Form.Item>
      </div>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} />
      </Form.Item>

      <div style={{ display: "flex", gap: 12 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </div>
    </Form>
  );
}

export default HotelForm;
