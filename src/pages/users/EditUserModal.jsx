import { Modal, Form, Input, Select, Button, notification } from "antd";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useSelector } from "react-redux";

function EditUserModal({ userId, open, onClose }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const currentUser = useSelector((state) => state.auth.user);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (open && userId) {
      api.get(`users/users/${userId}/`).then((res) => {
        form.setFieldsValue({
          username: res.data.username,
          email: res.data.email,
          phone_number: res.data.phone_number,
          role: res.data.role,
          status: res.data.status,
        });
      });
    }
  }, [open, userId]);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      await api.put(`users/users/${userId}/`, values);

      notification.success({
        message: "User Updated",
        description: "User details updated successfully",
      });

      onClose(true);
    } catch (err) {
      notification.error({
        message: "Update Failed",
        description:
          err.response?.data?.error || "Unable to update user",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit User"
      onCancel={() => onClose(false)}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Full Name" name="username">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>

        <Form.Item label="Phone Number" name="phone_number">
          <Input />
        </Form.Item>

        {isSuperAdmin && (
          <>
            <Form.Item label="Role" name="role">
              <Select>
                <Select.Option value="GROUP_ADMIN">Group Admin</Select.Option>
                <Select.Option value="HOTEL_MANAGER">Hotel Manager</Select.Option>
                <Select.Option value="FRONT_DESK">Hotel Staff</Select.Option>
                <Select.Option value="GUEST">Guest</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Status" name="status">
              <Select>
                <Select.Option value="ACTIVE">Active</Select.Option>
                <Select.Option value="SUSPENDED">Suspended</Select.Option>
                <Select.Option value="DELETED">Deleted</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        <Button type="primary" htmlType="submit" loading={loading} block>
          Update
        </Button>
      </Form>
    </Modal>
  );
}

export default EditUserModal;
