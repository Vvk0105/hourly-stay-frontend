import { Table, Button, Space, Tag } from "antd";
import { EyeTwoTone } from "@ant-design/icons";
import { icons } from "antd/es/image/PreviewGroup";
import { useNavigate } from "react-router-dom";
function HotelTable({data, loading}) {
    const navigate = useNavigate();
    const columns = [
        {
            title: "Hotel Name",
            dataIndex: "name",
        },
        {
            title: "City",
            dataIndex: "city",
        },
        {
            title: "Address",
            dataIndex: "address",
        },
        {
            title: "Status",
            dataIndex: "is_active",
            render: (is_active) => <Tag>{is_active ? "Active" : "Inactive"}</Tag>
        },
        {
            title: "Action",
            render: (_, record) =>(
                <Button
                icons={<EyeTwoTone />}
                onClick={() => navigate(`/hotels/${record.id}`)}
                />
            )
        }
      ];
  return (
    <Table 
    rowKey="id"
    columns={columns}
    dataSource={data}
    loading={loading}
    />
  )
}

export default HotelTable
