import { Table, Button, Space, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";

function AssignChangeTable({ data, loading, onEdit }) {
    const columns = [
    { title: "Name", dataIndex: "username" },
    { title: "Email ID", dataIndex: "email" },
    { title: "Phone Number", dataIndex: "phone_number" },
    {
      title: "Hotels",
      render: (_, record) => 
        record.hotels && record.hotels.length
        ? record.hotels.map(h => h.name).join(", ") : ""
    },
    {
      title: "Roles",
      dataIndex: "role",
      render: (role) => <Tag>{role}</Tag>
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        />
      )
    }
  ];
  return (
    <Table
      rowKey="uuid"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 5 }}
    />
  )
}

export default AssignChangeTable
