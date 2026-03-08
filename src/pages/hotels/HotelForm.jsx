import { Form, Input, Button, TimePicker, Select, notification } from "antd";
import api from "../../api/axios";
import dayjs from "dayjs";

const { Option } = Select;

// Common timezones
const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India - UTC+05:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE - UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (Thailand - UTC+07:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+01:00)' },
  { value: 'America/New_York', label: 'America/New York (UTC-05:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-08:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+11:00)' },
];

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
      initialValues={{
        timezone: 'Asia/Kolkata' // Default timezone
      }}
    >
      <Form.Item
        label="Hotel Name"
        name="name"
        rules={[{ required: true }]}
      >
        <Input id="name" name="name" />
      </Form.Item>

      <Form.Item label="Address" name="address" rules={[{ required: true }]}>
        <Input id="address" name="address" />
      </Form.Item>

      <div style={{ display: "flex", gap: 16 }}>
        <Form.Item label="City" name="city" rules={[{ required: true }]}>
          <Input id="city" name="city" />
        </Form.Item>

        <Form.Item label="State" name="state" rules={[{ required: true }]}>
          <Input id="state" name="state" />
        </Form.Item>

        <Form.Item label="Zip Code" name="zip_code">
          <Input id="zip_code" name="zip_code" />
        </Form.Item>
      </div>

      <Form.Item
        label="Hotel Timezone"
        name="timezone"
        rules={[{ required: true, message: 'Please select hotel timezone' }]}
        tooltip="All booking times will be displayed in this timezone"
      >
        <Select
          id="timezone"
          name="timezone"
          placeholder="Select hotel timezone"
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {TIMEZONES.map(tz => (
            <Option key={tz.value} value={tz.value}>{tz.label}</Option>
          ))}
        </Select>
      </Form.Item>

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
        <Input.TextArea id="description" name="description" rows={4} />
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
