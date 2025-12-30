import { Tag } from "antd";

const roleColorMap = {
  SUPER_ADMIN: "gold",
  GROUP_ADMIN: "orange",
  HOTEL_MANAGER: "green",
  HOTEL_STAFF: "default",
  SUPPORT: "blue",
};

function RoleTag({ role }) {
  return <Tag color={roleColorMap[role]}>{role.replace("_", " ")}</Tag>;
}

export default RoleTag;
