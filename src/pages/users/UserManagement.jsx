import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import UserFilters from "./UserFilters";
import UserTable from "./UserTable";
import api from "../../api/axios";
import { Button, notification, Modal } from "antd";
import AddUserModal  from "./AddUserModal"
import EditUserModal from "./EditUserModal";

function UserManagement() {
  const [editUserId, setEditUserId] = useState(null);
  const [openRole, setOpenRole] = useState(null); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("All");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
      current: 1,
      pageSize: 4,
      total: 0,
  });
  
  const fetchUsers = async (page = 1) => {
      setLoading(true);

      const res = await api.get("users/users/", {
      params: {
          page,
          page_size: pagination.pageSize,
          role: role !== "All" ? role : undefined,
          search,
          exclude_roles: "SUPER_ADMIN"
      },
      });
      const activeUsers = res.data.filter(
        (user) => user.status === "ACTIVE"
      );

      setUsers(activeUsers);
      setPagination({
      ...pagination,
      current: page,
      total: res.data.count,
      });

      setLoading(false);
  };

  const handleDelete = (userId) => {
    Modal.confirm({
      title: "Delete User",
      content: "Are you sure you want to delete this user?",
      okText: "Yes Delete",
      okType: "danger",
      cancelText: "Cancel",

      async onOk(){
        try {
          const res = await api.delete(`users/users/${userId}/`)
          
          notification.success({
            message: "User deleted successfully",
            description: res.data.message || "User deleted successfully",
          })

          fetchUsers(pagination.current)
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description:
              error.response?.data?.error ||
              "Unable to delete user",
          });
        }
      }
    })
  }

  const handleEditUser = (userId) => {
    setEditUserId(userId);
  };

  useEffect(() => {
      fetchUsers(1);
  }, [role, search]);

  return (
    <>
      <PageHeader 
      title="User Management" 
      actions={
          <>
            <Button onClick={() => setOpenRole("GROUP_ADMIN")}>
              + Group Admin
            </Button>
            <Button onClick={() => setOpenRole("HOTEL_MANAGER")}>
              + Hotel Manager
            </Button>
            <Button onClick={() => setOpenRole("HOTEL_STAFF")}>
              + Hotel Staff
            </Button>
            <Button onClick={() => setOpenRole("SUPPORT")}>
              + Support Agent
            </Button>
          </>
        }
      />

      <UserFilters
        role={role}
        setRole={setRole}
        search={search}
        setSearch={setSearch}
      />

      <UserTable
        data={users}
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => fetchUsers(pagination.current)}
        onDelete={handleDelete}
        onEdit={handleEditUser}
      />

      {openRole && (
        <AddUserModal
          open={true}
          role={openRole}
          onClose={(refresh) => {
            setOpenRole(null);

            if (refresh) {
              fetchUsers(1);
            }
          }}
        />
      )}

      {editUserId && (
        <EditUserModal
          open={true}
          userId={editUserId}
          onClose={(refresh) => {
            setEditUserId(null);
            if (refresh) fetchUsers(pagination.current);
          }}
        />
      )}
    </>
  );
}

export default UserManagement;
