import { Input, Segmented } from "antd";

const roles = [{
    label: "All",
    value: "All",
},
{
    label: "Group Admin",
    value: "GROUP_ADMIN",
},
{
    label: "Hotel Manager",
    value: "HOTEL_MANAGER",
},
{
    label: "Hotel Staff",
    value: "FRONT_DESK",
},
{
    label: "Support",
    value: "SUPPORT_AGENT",
},
{
    label: "Users",
    value: "GUEST",
}];

function UserFilters({ role, setRole, search, setSearch }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <Segmented
        options={roles}
        value={role}
        onChange={setRole}
      />

      <Input.Search
        placeholder="Search here..."
        style={{ width: 240 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

export default UserFilters;
