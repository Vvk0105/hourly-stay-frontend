import { Table, Button, Tag, Space } from "antd";
import { EyeTwoTone, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function HotelTable({ data, loading }) {
  const navigate = useNavigate();
  
  const columns = [
    {
      title: "Hotel Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Mode",
      dataIndex: "is_hourly_enabled",
      key: "is_hourly_enabled",
      render: (enabled) => (
        <Tag color={enabled ? "green" : "blue"}>
          {enabled ? "Hourly + Nightly" : "Nightly Only"}
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === 'ACTIVE' ? 'success' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeTwoTone />} 
            onClick={() => navigate(`/hotels/${record.id}`)} 
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/hotels/${record.id}/edit`)} 
          />
        </Space>
      )
    }
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
}

export default HotelTable;