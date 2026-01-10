import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import AssignChangeTable from "./AssignChangeTable";
import AssignHotelModal from "./AssignHotelModal";
import api from "../../api/axios";
import { Input } from "antd";

function AssignChangePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const res = await api.get("users/users/", {
      params: {
        status: "ACTIVE",
        exclude_roles: "SUPER_ADMIN,SUPPORT_AGENT,GUEST",
        search: search
      }
    });
    setUsers(res.data.results);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  return (
    <>
      <PageHeader title="Assign & Change" />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Input.Search
          placeholder="Search Users..."
          style={{ width: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AssignChangeTable
        data={users}
        loading={loading}
        onEdit={(user) => setSelectedUser(user)}
      />

      {selectedUser && (
        <AssignHotelModal
          user={selectedUser}
          open={true}
          onClose={(refresh) => {
            setSelectedUser(null);
            if (refresh) fetchUsers();
          }}
        />
      )}
    </>
  )
}

export default AssignChangePage
