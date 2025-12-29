import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import AssignChangeTable from "./AssignChangeTable";
import AssignHotelModal from "./AssignHotelModal";
import api from "../../api/axios";

function AssignChangePage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        const res = await api.get("users/users/", {
        params: { status: "ACTIVE",  exclude_roles: "SUPER_ADMIN,SUPPORT,GUEST" }
        });
        setUsers(res.data.results);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
  return (
    <>
    <PageHeader title="Assign & Change" />

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
