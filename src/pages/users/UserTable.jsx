import { Table, Space, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import RoleTag from "../../components/common/RoleTag";
import { useSelector } from "react-redux";
import { can, ROLES } from "../../utils/accessControl";

function UserTable({ data, loading, pagination, onChange, onDelete, onEdit }) {
  const { user } = useSelector(state => state.auth);

  // Helper to check if current user can manage a targeted record
  const canManage = (targetRecord) => {
    if (user.role === ROLES.SUPER_ADMIN) return true;
    
    // Check if they share any hotel_id
    const sharedHotel = user.hotels?.some(h => 
      targetRecord.hotels?.some(targetH => targetH.id === (h.id || h))
    );
    
    return sharedHotel;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "username",
    },
    {
      title: "Email ID",
      dataIndex: "email",
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
    },
    {
      title: "Hotels",
      render: (_, record) => 
        record.hotels && record.hotels.length
        ? record.hotels.map(h => h.name).join(", ") : ""
    },
    {
      title: "Roles",
      render: (_, record) => <RoleTag role={record.role} />,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          {can(user, 'UPDATE_USER') && canManage(record) && (
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(record.uuid)}
            />
          )}
          {can(user, 'DELETE_USER') && canManage(record) && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={()=> {onDelete(record.uuid)}} 
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="uuid"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        ...pagination,
        placement: ["bottomCenter"],
    }}
      onChange={onChange}
    />
  );
}

export default UserTable;
